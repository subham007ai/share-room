# Architecture Reference

## Service Layer Pattern

The rule is simple: routes are thin, services own logic, lib is infrastructure.

```
Request → Middleware → Route (validate + call service) → Service (business logic) → Lib (db/redis/queue)
                                                        ↓
                                               Response ← Route
```

**What belongs where:**

```
routes/       validate inputs, call service, return response. No business logic. No direct DB calls.
services/     business rules, orchestration. No Express types (req, res). Testable in isolation.
lib/          singletons: db, redis, logger, queues. No business logic.
middleware/   cross-cutting: auth, rate limit, validate, error handler. Reusable.
jobs/         worker definitions. Read job data, call service functions.
```

---

## File Naming

```
src/
  routes/
    auth.ts           # authRouter
    posts.ts          # postsRouter
    users.ts          # usersRouter
  services/
    auth.service.ts   # register(), login(), refresh(), logout()
    post.service.ts   # listPosts(), getPost(), createPost(), updatePost(), deletePost()
    user.service.ts
  lib/
    db.ts             # export const db
    redis.ts          # export const redis
    logger.ts         # export const logger
    queue.ts          # export const emailQueue, etc.
    cache.ts          # export const cache, cacheKeys
  middleware/
    authenticate.ts   # authenticate, requireRole
    validate.ts       # validate()
    rate-limit.ts     # rateLimit()
    error-handler.ts  # errorHandler, AppError, NotFound, Forbidden, Conflict
  jobs/
    email.worker.ts
    notification.worker.ts
    scheduler.ts      # setupScheduledJobs()
  types/
    auth.types.ts     # Zod schemas + inferred types
```

---

## Monolith vs Microservices

**Default: monolith.** Seriously.

Split a service out only when you can answer yes to at least two of:
- Two+ teams are in merge conflict weekly because of this boundary
- This component needs to scale 10x independently of everything else
- This component needs a different deployment cadence (hourly vs weekly)
- This component has a meaningfully different failure tolerance (payments vs search)

---

## When to Use a Queue

```
Sync (HTTP) when:                      Async (queue) when:
- Client needs result to continue      - Client doesn't need result immediately
- Operation takes < 2 seconds          - Operation is slow (email, PDF, external API)
- Easy to retry on client              - Must survive server restarts
- Naturally idempotent                 - Expensive enough to rate limit
```

---

## Scaling Checklist

Before you need to scale, make sure you have:

- [ ] Stateless app servers (no in-memory session state)
- [ ] Sessions/auth in Redis, not process memory
- [ ] File storage in S3, not disk
- [ ] DB connection pooling configured correctly
- [ ] Slow query log enabled
- [ ] Health + readiness endpoints wired to load balancer
- [ ] Horizontal pod autoscaling triggers defined

---

## Environment Architecture

```
Local dev:
  Docker Compose → PostgreSQL + Redis + app

Staging:
  Same infra as prod, smaller sizes
  Runs migrations before app starts
  Seeded with anonymized prod-like data

Production:
  Managed PostgreSQL (RDS/Supabase/Neon) + Redis (ElastiCache/Upstash)
  App in containers (ECS/Railway/Render/Fly)
  Read replica for heavy analytics queries
  Backups: automated daily, tested monthly
```

---

## Database Scaling Progression

1. **Indexes** — fix before anything else. 90% of "we need to scale" is actually "we need an index"
2. **Query optimization** — EXPLAIN ANALYZE, eliminate N+1, cursor pagination
3. **Read replica** — route read-heavy queries to replica
4. **Connection pooler** — PgBouncer in front of Postgres when you hit connection limits
5. **Caching** — Redis cache for frequently-read, slow-to-compute data
6. **Sharding** — last resort, operationally very hard

Don't jump to step 5 before you've genuinely exhausted steps 1-3.

---

## Circuit Breaker (for external service calls)

```typescript
import CircuitBreaker from 'opossum'

const paymentBreaker = new CircuitBreaker(callPaymentService, {
  timeout: 5_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5  // min calls before opening
})

paymentBreaker.fallback(() => ({
  status: 'queued',
  message: 'Payment processing delayed, you will receive confirmation shortly'
}))

paymentBreaker.on('open', () =>
  logger.warn('Payment service circuit breaker OPEN')
)
```

---

## Outbox Pattern (Reliable Event Publishing)

When you must guarantee an event is published after a DB write — never dual-write:

```typescript
// Write event to outbox in same transaction as domain change
async function createOrder(input: CreateOrderInput) {
  return db.$transaction(async (trx) => {
    const order = await trx.order.create({ data: input })

    await trx.outboxEvent.create({
      data: {
        type: 'order.created',
        aggregateId: order.id,
        payload: JSON.stringify(order)
      }
    })

    return order
  })
}

// Separate poller reads outbox and publishes to queue
// This runs on a cron or dedicated worker
async function processOutbox() {
  const events = await db.outboxEvent.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 100
  })

  for (const event of events) {
    await eventQueue.add(event.type, JSON.parse(event.payload))
    await db.outboxEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() }
    })
  }
}
```
