# API Design Reference

## Route Structure Template

Every resource follows this exact pattern. Don't deviate.

```typescript
// src/routes/posts.ts
import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/authenticate'
import { rateLimit } from '../middleware/rate-limit'
import * as postService from '../services/post.service'

export const postsRouter = Router()

// Schemas live with the routes that use them (or in src/types/ if shared)
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(50_000),
  tags: z.array(z.string().max(50)).max(10).default([]),
  publishNow: z.boolean().default(false)
})

const UpdatePostSchema = CreatePostSchema.partial()

const ListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published']).optional()
})

// GET /v1/posts
postsRouter.get('/', authenticate, validate(ListQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await postService.listPosts(req.user.id, req.query)
    res.json(result)  // { data: [...], pagination: {...} }
  } catch (err) { next(err) }
})

// GET /v1/posts/:id
postsRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await postService.getPost(req.params.id, req.user.id)
    res.json({ data: post })
  } catch (err) { next(err) }
})

// POST /v1/posts
postsRouter.post('/',
  authenticate,
  rateLimit({ max: 30, windowSeconds: 3600 }),  // 30 creates/hour
  validate(CreatePostSchema),
  async (req, res, next) => {
    try {
      const post = await postService.createPost(req.user.id, req.body)
      res.status(201).json({ data: post })
    } catch (err) { next(err) }
  }
)

// PATCH /v1/posts/:id
postsRouter.patch('/:id', authenticate, validate(UpdatePostSchema), async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.id, req.user.id, req.body)
    res.json({ data: post })
  } catch (err) { next(err) }
})

// DELETE /v1/posts/:id
postsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await postService.deletePost(req.params.id, req.user.id)
    res.status(204).send()
  } catch (err) { next(err) }
})
```

---

## Response Envelope

Never deviate from these shapes:

```typescript
// Single resource
res.json({ data: resource })

// Collection with pagination
res.json({
  data: items,
  pagination: {
    hasMore: boolean,
    nextCursor: string | null,
    limit: number
  }
})

// Created
res.status(201).json({ data: resource })

// Deleted
res.status(204).send()

// Error (from error-handler middleware — you never write this manually)
{
  error: {
    code: 'SNAKE_CASE_CODE',
    message: 'Human readable message',
    details: { fieldName: ['error message'] },  // validation only
    request_id: 'req_xxx'
  }
}
```

---

## HTTP Status Code Reference

```
200 — OK (GET, PATCH, PUT success)
201 — Created (POST success)
204 — No Content (DELETE, logout)
400 — Bad Request (malformed JSON, wrong content-type)
401 — Unauthenticated (no token, expired token)
403 — Unauthorized (valid token, wrong permissions)
404 — Not Found
409 — Conflict (duplicate email, state mismatch)
422 — Unprocessable (validation errors — Zod failures)
429 — Rate Limited
500 — Server Error (never leak internals)
```

---

## Idempotency Keys (for mutations that must not double-execute)

```typescript
// src/middleware/idempotency.ts
import { cache } from '../lib/cache'
import { Request, Response, NextFunction } from 'express'

export function idempotent(ttlSeconds = 86_400) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'] as string
    if (!key) return next()

    const cacheKey = `idempotency:${req.user?.id}:${key}`
    const cached = await cache.get(cacheKey)

    if (cached) {
      // Return cached response
      const { status, body } = cached as any
      return res.status(status).json(body)
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      cache.set(cacheKey, { status: res.statusCode, body }, ttlSeconds)
      return originalJson(body)
    }

    next()
  }
}

// Usage on payment/order routes
ordersRouter.post('/',
  authenticate,
  idempotent(),
  validate(CreateOrderSchema),
  async (req, res, next) => { ... }
)
```

---

## Versioning

URL prefix. Always `/v1/`, `/v2/`. Never headers.

```typescript
// src/app.ts
app.use('/v1/auth', authRouter)
app.use('/v1/posts', postsRouter)
app.use('/v1/users', usersRouter)
// Breaking change? New prefix, not modified old routes
app.use('/v2/users', usersV2Router)
```

---

## Deprecation Headers

```typescript
// When a v1 route is deprecated
res.set('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT')
res.set('Deprecation', 'true')
res.set('Link', '</v2/users>; rel="successor-version"')
```

---

## Request ID Flow

Already wired in app.ts. Flows through:
1. `req.id` set by middleware
2. Sent in `X-Request-Id` response header
3. Logged by pino-http on every request
4. Attached to every error response
5. Pass downstream: `headers: { 'X-Request-Id': req.id }` when calling other services
