# Project Scaffold Reference

Drop this skeleton for every new project. Copy, don't rebuild.

---

## package.json

```json
{
  "name": "your-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.1",
    "bullmq": "^5.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "nanoid": "^3.3.7",
    "pino": "^8.17.0",
    "pino-http": "^9.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.0",
    "prisma": "^5.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## .env.example

```bash
# App
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=change-me-in-production-32-chars-min
JWT_REFRESH_SECRET=change-me-in-production-32-chars-min-different
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# AWS (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3001
```

---

## src/app.ts

```typescript
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { nanoid } from 'nanoid'
import { logger } from './lib/logger'
import { errorHandler } from './middleware/error-handler'
import { healthRouter } from './routes/health'
// import { authRouter } from './routes/auth'
// import { usersRouter } from './routes/users'

export function createApp() {
  const app = express()

  // Security
  app.use(helmet())
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key']
  }))

  // Request ID — attached before any logging
  app.use((req, res, next) => {
    req.id = (req.headers['x-request-id'] as string) || `req_${nanoid()}`
    res.set('X-Request-Id', req.id)
    next()
  })

  // Body parsing
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  // HTTP logging
  app.use(pinoHttp({
    logger,
    genReqId: (req) => req.id as string,
    customLogLevel: (req, res) => res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
  }))

  // Routes
  app.use('/health', healthRouter)
  app.use('/v1/auth', authRouter)
  // app.use('/v1/users', authenticate, usersRouter)

  // Error handler — must be last
  app.use(errorHandler)

  return app
}
```

---

## src/server.ts

```typescript
import { createApp } from './app'
import { db } from './lib/db'
import { redis } from './lib/redis'
import { logger } from './lib/logger'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const app = createApp()

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown initiated')
  server.close(async () => {
    await db.$disconnect()
    redis.disconnect()
    logger.info('Shutdown complete')
    process.exit(0)
  })
  // Force kill if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection')
  process.exit(1)
})
```

---

## src/lib/db.ts

```typescript
import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
    : ['error', 'warn']
})

if (process.env.NODE_ENV === 'development') {
  db.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'DB query')
  })
}
```

---

## src/lib/redis.ts

```typescript
import { Redis } from 'ioredis'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true
})

redis.on('error', (err) => logger.error({ err }, 'Redis error'))
redis.on('connect', () => logger.info('Redis connected'))
```

---

## src/lib/logger.ts

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', '*.secret', '*.password'],
    remove: true
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})
```

---

## src/routes/health.ts

```typescript
import { Router } from 'express'
import { db } from '../lib/db'
import { redis } from '../lib/redis'

export const healthRouter = Router()

// Liveness — is the process alive?
healthRouter.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Readiness — can it accept traffic?
healthRouter.get('/ready', async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`
    await redis.ping()
    res.json({ status: 'ready', timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      error: err instanceof Error ? err.message : 'Unknown error'
    })
  }
})
```

---

## src/middleware/error-handler.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const NotFound = (resource: string) =>
  new AppError(404, 'NOT_FOUND', `${resource} not found`)

export const Forbidden = () =>
  new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action')

export const Conflict = (message: string) =>
  new AppError(409, 'CONFLICT', message)

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
    if (err.statusCode >= 500) {
      logger.error({ err, request_id: req.id }, err.message)
    } else {
      logger.warn({ code: err.code, request_id: req.id }, err.message)
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        request_id: req.id
      }
    })
  }

  logger.error({ err, request_id: req.id }, 'Unhandled error')
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: req.id
    }
  })
}
```

---

## src/middleware/validate.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) return next(result.error)
    req[source] = result.data
    next()
  }
}
```

---

## Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

---

## prisma/schema.prisma (base)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?  // null for OAuth users
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash")
  expiresAt DateTime @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

enum Role {
  USER
  ADMIN
}
```
