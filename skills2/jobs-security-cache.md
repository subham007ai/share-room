# Jobs Reference (BullMQ)

## Queue Setup — src/lib/queue.ts

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq'
import { redis } from './redis'

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { count: 200, age: 86_400 },
  removeOnFail: { count: 500 }
}

export const emailQueue = new Queue('emails', { connection: redis, defaultJobOptions })
export const notificationQueue = new Queue('notifications', { connection: redis, defaultJobOptions })

// For one-time use (no persistence needed)
export const backgroundQueue = new Queue('background', {
  connection: redis,
  defaultJobOptions: { ...defaultJobOptions, attempts: 1 }
})
```

---

## Worker Pattern — src/jobs/email.worker.ts

```typescript
import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'
import { db } from '../lib/db'

interface EmailJobData {
  userId: string
  type: 'welcome' | 'password-reset' | 'invoice'
  meta?: Record<string, unknown>
}

export const emailWorker = new Worker<EmailJobData>(
  'emails',
  async (job: Job<EmailJobData>) => {
    const { userId, type } = job.data

    // Always fetch fresh — don't trust stale queue payload
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      logger.warn({ jobId: job.id, userId }, 'User not found — skipping email')
      return { skipped: true }
    }

    switch (type) {
      case 'welcome':
        await sendWelcomeEmail(user)
        break
      case 'password-reset':
        await sendPasswordResetEmail(user, job.data.meta?.token as string)
        break
      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    return { sent: true, userId, type }
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: { max: 100, duration: 60_000 }  // 100 jobs/min
  }
)

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, attempt: job?.attemptsMade, err }, 'Email job failed')
})

emailWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Email job completed')
})
```

---

## Idempotency Pattern

```typescript
// Pattern: store result in DB, check before processing
export async function processWebhookEvent(jobId: string, eventId: string, payload: unknown) {
  // Check if already processed
  const existing = await db.processedEvent.findUnique({ where: { eventId } })
  if (existing) {
    logger.info({ eventId }, 'Event already processed — skipping')
    return existing.result
  }

  const result = await handleEvent(payload)

  // Upsert result atomically
  await db.processedEvent.upsert({
    where: { eventId },
    create: { eventId, result: JSON.stringify(result), processedAt: new Date() },
    update: {}  // do nothing on conflict — first write wins
  })

  return result
}
```

---

## Cron Jobs

```typescript
// src/jobs/scheduler.ts — run once on startup, deduplicated by jobId
import { emailQueue } from '../lib/queue'

export async function setupScheduledJobs() {
  // Daily digest at 9am UTC
  await emailQueue.add(
    'daily-digest',
    {},
    {
      repeat: { cron: '0 9 * * *' },
      jobId: 'daily-digest'  // prevents duplicates on restart
    }
  )
}
```

---

# Security Reference

## Rate Limiting — src/middleware/rate-limit.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { redis } from '../lib/redis'
import { AppError } from './error-handler'

interface RateLimitOptions {
  max: number
  windowSeconds: number
  keyFn?: (req: Request) => string
}

export function rateLimit({ max, windowSeconds, keyFn }: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyFn ? keyFn(req) : (req.user?.id ?? req.ip)
    const key = `rl:${req.path}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    try {
      const pipe = redis.pipeline()
      pipe.zremrangebyscore(key, '-inf', windowStart)
      pipe.zadd(key, now, `${now}-${Math.random()}`)
      pipe.zcard(key)
      pipe.expire(key, windowSeconds)
      const results = await pipe.exec()
      const count = results![2][1] as number

      const remaining = Math.max(0, max - count)
      const resetAt = Math.floor((now + windowSeconds * 1000) / 1000)

      res.set({
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(resetAt)
      })

      if (count > max) {
        res.set('Retry-After', String(windowSeconds))
        return next(new AppError(429, 'RATE_LIMITED', 'Too many requests, slow down'))
      }

      next()
    } catch (err) {
      // Don't block the request if Redis is down
      next()
    }
  }
}
```

---

## Webhook Receiver — src/routes/webhooks.ts

```typescript
import { Router } from 'express'
import crypto from 'crypto'
import { webhookQueue } from '../lib/queue'
import { logger } from '../lib/logger'

export const webhookRouter = Router()

// IMPORTANT: raw body required for signature verification
webhookRouter.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string

    if (!verifyStripeSignature(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)) {
      logger.warn({ sig }, 'Invalid webhook signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Acknowledge immediately — never make Stripe wait
    res.status(200).json({ received: true })

    const event = JSON.parse(req.body.toString())
    
    // Enqueue with event ID for deduplication
    await webhookQueue.add(event.type, { event }, {
      jobId: event.id  // BullMQ deduplication
    }).catch((err) => logger.error({ err, eventId: event.id }, 'Failed to enqueue webhook'))
  }
)

function verifyStripeSignature(payload: Buffer, header: string, secret: string): boolean {
  try {
    const timestamp = header.split(',').find(p => p.startsWith('t='))?.split('=')[1]
    const signatures = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.split('=')[1])
    
    const signedPayload = `${timestamp}.${payload.toString()}`
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    
    return signatures.some(sig =>
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
  } catch {
    return false
  }
}
```

---

# Caching Reference

## Redis Cache Helper — src/lib/cache.ts

```typescript
import { redis } from './redis'
import { logger } from './logger'

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    } catch (err) {
      logger.warn({ err, key }, 'Cache get failed')
      return null  // degrade gracefully
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (err) {
      logger.warn({ err, key }, 'Cache set failed')
    }
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return
    try {
      await redis.del(...keys)
    } catch (err) {
      logger.warn({ err, keys }, 'Cache del failed')
    }
  },

  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await cache.get<T>(key)
    if (cached !== null) return cached

    const value = await fn()
    await cache.set(key, value, ttlSeconds)
    return value
  }
}

// Consistent key builders — never construct keys inline
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userPosts: (userId: string) => `user:${userId}:posts`,
  post: (id: string) => `post:${id}`,
}
```

**Usage:**
```typescript
// Read-through
const user = await cache.wrap(
  cacheKeys.user(userId),
  300,  // 5 min TTL
  () => db.user.findUniqueOrThrow({ where: { id: userId } })
)

// Invalidate on write
await db.user.update({ where: { id: userId }, data })
await cache.del(cacheKeys.user(userId), cacheKeys.userPosts(userId))
```

---

# Observability Reference

## Request Logging — already wired in app.ts via pino-http

Key fields on every log line:
- `req.id` — request ID
- `req.method`, `req.url`
- `res.statusCode`
- `responseTime` — duration in ms
- `user_id` — add via `logger.child({ userId })` in authenticated routes

## Error Tracking Integration

```typescript
// src/middleware/error-handler.ts — add Sentry if needed
import * as Sentry from '@sentry/node'

// In errorHandler, before logging:
if (err instanceof AppError && err.statusCode >= 500) {
  Sentry.captureException(err, { extra: { request_id: req.id } })
}
```

## Health Checks — already in scaffold

`GET /health` — liveness (process alive)  
`GET /health/ready` — readiness (DB + Redis connected)

Wire these to your load balancer / Kubernetes probes.
