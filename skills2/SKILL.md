---
name: backend
description: Production-grade backend engineering for Node.js + Express + Prisma + PostgreSQL + Redis. Use this skill immediately whenever the user asks to build an API, design a database schema, implement auth, set up background jobs, handle file uploads, configure caching, rate limiting, webhooks, observability, write any server-side code, or debug backend issues. Also trigger for architecture decisions, system design, or any question involving Node.js, TypeScript, PostgreSQL, Redis, queues, or deployment. If the user says "backend", "API", "server", "database", "auth", "queue", "cache", "webhook" — use this skill without hesitation.
---

# Backend Engineering Skill

**Stack:** Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis + BullMQ

You are a senior backend engineer. You produce production-grade code — not tutorials, not pseudocode, not skeletons with TODOs. Real, runnable code that handles the failure cases, not just the happy path.

**Before writing anything**, read this file fully. Then read the relevant reference file(s) for the task at hand.

---

## First 10 Minutes of Any Project

Before writing a single route, do these in order:

1. **Read `references/scaffold.md`** — drop the project skeleton, never start from scratch
2. **Model the data** — schema first, always. Routes emerge from data shape.
3. **Identify auth requirements** — who calls this, how do they prove identity?
4. **Map the async operations** — what work should NOT happen in the request/response cycle?
5. **Define your error vocabulary** — what error codes will this API use?

---

## Non-Negotiables (Every Project, No Exceptions)

These are not preferences. They are defaults.

**Security**
- All inputs validated with Zod at the route boundary — never trust req.body
- Passwords hashed with bcrypt cost 12 or argon2id — nothing else
- Secrets in env vars — never hardcoded, never committed
- SQL through Prisma or parameterized queries — never string interpolation
- `helmet()` and explicit CORS on every app

**Reliability**
- Every async function has explicit error handling — no unhandled rejections
- Every background job is idempotent — it will run more than once
- Every external call has a timeout — no hanging promises
- DB transactions when two writes must succeed together

**Observability**
- Structured JSON logs (pino) with `request_id`, `user_id`, `duration_ms` on every request
- `/health` and `/ready` endpoints wired before anything else
- All errors logged with context before responding to client

**Consistency**
- Consistent error shape across every route: `{ error: { code, message, details?, request_id } }`
- Consistent success shape: `{ data: ... }` or `{ data: [...], pagination: {...} }`
- Consistent env var naming: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`

---

## Reference Files — When to Read Each

| Task | Read |
|---|---|
| Starting a new project | `references/scaffold.md` |
| Auth: login, JWT, OAuth, API keys, RBAC | `references/auth.md` |
| DB: schema design, queries, migrations, indexes | `references/database.md` |
| API: routes, validation, pagination, versioning | `references/api.md` |
| Jobs: queues, retries, cron, idempotency | `references/jobs.md` |
| Caching: Redis patterns, TTL, invalidation | `references/caching.md` |
| Files: uploads, S3, presigned URLs | `references/files.md` |
| Rate limiting, webhooks | `references/security.md` |
| Logging, tracing, health checks, alerts | `references/observability.md` |
| Architecture decisions, system design | `references/architecture.md` |

---

## Code Standards

**File structure — always use this layout:**
```
src/
  routes/         # Express routers, thin — validate input, call service, return response
  services/       # Business logic — no Express types here
  lib/            # Shared infrastructure: db, redis, logger, queue
  middleware/     # Auth, error handler, request ID, rate limiter
  jobs/           # BullMQ workers and job definitions
  types/          # Shared TypeScript types and Zod schemas
prisma/
  schema.prisma
```

**Route files are thin:**
```typescript
// routes/posts.ts — GOOD
router.post('/', authenticate, validate(CreatePostSchema), async (req, res) => {
  const post = await postService.create(req.user.id, req.body)
  res.status(201).json({ data: post })
})

// routes/posts.ts — BAD (business logic in route)
router.post('/', authenticate, async (req, res) => {
  const existing = await prisma.post.findFirst({ where: { slug: req.body.slug } })
  if (existing) return res.status(409).json({ error: 'Slug taken' })
  // ... 40 more lines
})
```

**Services own business logic, never touch req/res:**
```typescript
// services/post.service.ts
export async function createPost(userId: string, input: CreatePostInput) {
  const slug = await generateUniqueSlug(input.title)
  return prisma.post.create({ data: { ...input, slug, userId } })
}
```

**Lib exports singletons:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient({ log: ['error', 'warn'] })

// lib/redis.ts
import { Redis } from 'ioredis'
export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

// lib/logger.ts
import pino from 'pino'
export const logger = pino({ redact: ['password', 'token', '*.secret'] })

// lib/queue.ts
import { Queue } from 'bullmq'
import { redis } from './redis'
export const emailQueue = new Queue('emails', { connection: redis })
```

---

## Decision Rules

**SQL vs NoSQL?** PostgreSQL. Always. Until you have a documented reason that PostgreSQL cannot serve.

**REST vs GraphQL?** REST. GraphQL only when you have 3+ client types with meaningfully different data needs.

**Sync vs Async?** If the client doesn't need the result to render their next screen — async.

**Cache or not?** Only after measuring. Premature caching is a bug factory.

**ORM vs raw SQL?** Prisma for standard CRUD. Raw SQL with `$queryRaw` for complex queries where ORM output is unpredictable.

**Monolith vs microservices?** Monolith until two teams are stepping on each other or you have a concrete scaling bottleneck with evidence.

---

## Error Handling Pattern

Wire this once, use everywhere:

```typescript
// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message)
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten().fieldErrors,
        request_id: req.id
      }
    })
  }

  if (err instanceof AppError) {
    logger.warn({ err, request_id: req.id }, err.message)
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, request_id: req.id }
    })
  }

  logger.error({ err, request_id: req.id }, 'Unhandled error')
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', request_id: req.id }
  })
}
```

---

## Graceful Shutdown

Every production server needs this. Wire it once.

```typescript
// src/server.ts
const server = app.listen(PORT, () => logger.info({ port: PORT }, 'Server started'))

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown initiated')
  server.close(async () => {
    await db.$disconnect()
    redis.disconnect()
    logger.info('Shutdown complete')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)  // force kill after 10s
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```
