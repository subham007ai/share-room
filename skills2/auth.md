# Auth Reference

## Complete Auth Flow (Email + Password + JWT)

### Zod Schemas — src/types/auth.types.ts

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(72),  // bcrypt truncates at 72 bytes
  name: z.string().min(1).max(100).trim()
})

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

---

### Auth Service — src/services/auth.service.ts

```typescript
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { addDays } from 'date-fns'
import { db } from '../lib/db'
import { AppError } from '../middleware/error-handler'
import type { RegisterInput, LoginInput } from '../types/auth.types'

const BCRYPT_ROUNDS = 12
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

// --- Token helpers ---

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    algorithm: 'HS256'
  })
}

export function verifyAccessToken(token: string): { sub: string; role: string } {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] }) as any
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// --- Core operations ---

export async function register(input: RegisterInput) {
  const existing = await db.user.findUnique({ where: { email: input.email } })
  if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered')

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const user = await db.user.create({
    data: { email: input.email, password: hashedPassword, name: input.name },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  })

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role)
  return { user, accessToken, refreshToken }
}

export async function login(input: LoginInput) {
  const user = await db.user.findUnique({ where: { email: input.email } })

  // Constant-time failure — don't reveal whether email exists
  const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const passwordMatch = await bcrypt.compare(
    input.password,
    user?.password ?? dummyHash
  )

  if (!user || !passwordMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  if (user.deletedAt) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'This account has been disabled')
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role)
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken
  }
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken)
  const stored = await db.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // If token existed but is revoked — possible token theft. Revoke all for user.
    if (stored && stored.revokedAt) {
      await db.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Refresh token is invalid or expired')
  }

  // Revoke old token (rotation)
  await db.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  })

  const user = await db.user.findUniqueOrThrow({ where: { id: stored.userId } })
  return issueTokenPair(user.id, user.role)
}

export async function logout(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken)
  await db.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  })
}

async function issueTokenPair(userId: string, role: string) {
  const refreshToken = generateRefreshToken()
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDays(new Date(), 30)
    }
  })
  return { accessToken: signAccessToken(userId, role), refreshToken }
}
```

---

### Auth Middleware — src/middleware/authenticate.ts

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../services/auth.service'
import { AppError } from './error-handler'

declare global {
  namespace Express {
    interface Request {
      id: string
      user: { id: string; role: string }
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'MISSING_TOKEN', 'Authorization header required'))
  }

  try {
    const payload = verifyAccessToken(header.slice(7))
    req.user = { id: payload.sub, role: payload.role }
    next()
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Token is invalid or expired'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'))
    }
    next()
  }
}
```

---

### Auth Routes — src/routes/auth.ts

```typescript
import { Router } from 'express'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/authenticate'
import { RegisterSchema, LoginSchema } from '../types/auth.types'
import * as authService from '../services/auth.service'

export const authRouter = Router()

authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body)
    res.status(201).json({ data: result })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.body.refresh_token
    if (!token) return next(new AppError(400, 'MISSING_TOKEN', 'refresh_token required'))
    const result = await authService.refresh(token)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    const token = req.body.refresh_token
    if (token) await authService.logout(token)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
```

---

## API Key Auth

```typescript
// src/services/api-key.service.ts
import crypto from 'crypto'
import { db } from '../lib/db'

export function generateApiKey() {
  const raw = `sk_live_${crypto.randomBytes(32).toString('hex')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.substring(0, 14)  // shown in UI for identification
  return { raw, hash, prefix }
}

export async function verifyApiKey(raw: string) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const key = await db.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: true }
  })
  if (!key || key.revokedAt) return null
  
  // Update last used async — don't wait
  db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  return key.user
}
```

```prisma
// Add to schema.prisma
model ApiKey {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  name       String
  keyHash    String    @unique @map("key_hash")
  keyPrefix  String    @map("key_prefix")
  lastUsedAt DateTime? @map("last_used_at")
  expiresAt  DateTime? @map("expires_at")
  revokedAt  DateTime? @map("revoked_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("api_keys")
}
```

---

## Rate Limit Auth Endpoints Specifically

```typescript
// More aggressive limits on auth routes
import { rateLimit } from '../middleware/rate-limit'

authRouter.post('/login',
  rateLimit({ max: 5, windowSeconds: 900, keyFn: (req) => req.ip }),  // 5/15min per IP
  validate(LoginSchema),
  async (req, res, next) => { ... }
)
```

---

## Common Auth Mistakes

- **Storing refresh tokens in localStorage** — use httpOnly cookies or secure mobile storage
- **Same secret for access and refresh** — they must be different
- **Not invalidating all tokens on password change** — revoke all refresh tokens for the user
- **Timing attacks on email lookup** — always run bcrypt.compare even when user not found (see login above)
- **Trusting `alg: none` JWTs** — always specify `algorithms: ['HS256']` in verify
