# Database Reference (Prisma + PostgreSQL)

## Schema Conventions

Every model follows this pattern:

```prisma
model Post {
  id        String    @id @default(uuid())
  // ... fields
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")  // soft delete

  @@map("posts")  // snake_case table names
}
```

Rules:
- UUIDs as primary keys — never expose sequential IDs to clients
- `@@map` everything to snake_case — your DB shouldn't care about TS conventions
- Every FK field gets an explicit `@@index` or `@relation` index
- Soft deletes on user-generated content — hard deletes for system records

---

## Indexes — When and How

```prisma
model Post {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  status    String   @default("draft")
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  // Composite for the most common query pattern
  @@index([userId, status, createdAt(sort: Desc)])
  // Partial index for active posts only (raw migration)
  @@map("posts")
}
```

For partial indexes (Prisma doesn't support them natively):
```typescript
// prisma/migrations/xxx/migration.sql — add after Prisma's generated SQL
CREATE INDEX idx_posts_active ON posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
```

**Index decision checklist:**
- Every FK: yes, always
- Columns in WHERE: yes if high cardinality (email, uuid, status+userId)
- Columns in ORDER BY: yes if paginating
- Boolean/low-cardinality alone: no — partial index instead

---

## Query Patterns

### Cursor Pagination (never use skip/offset for production)

```typescript
// src/services/post.service.ts
interface ListPostsOptions {
  userId: string
  cursor?: string  // base64-encoded { id, createdAt }
  limit?: number
}

export async function listPosts({ userId, cursor, limit = 20 }: ListPostsOptions) {
  const take = Math.min(limit, 100)  // cap at 100
  let cursorCondition = {}

  if (cursor) {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString())
    cursorCondition = { cursor: { id: decoded.id }, skip: 1 }
  }

  const posts = await db.post.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,  // fetch one extra to determine hasMore
    ...cursorCondition,
    select: { id: true, title: true, slug: true, status: true, createdAt: true }
  })

  const hasMore = posts.length > take
  const data = hasMore ? posts.slice(0, take) : posts
  const last = data[data.length - 1]

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore
        ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString('base64url')
        : null,
      limit: take
    }
  }
}
```

### N+1 — Always Use Select or Include Deliberately

```typescript
// BAD — N+1
const posts = await db.post.findMany({ where: { userId } })
for (const post of posts) {
  const author = await db.user.findUnique({ where: { id: post.userId } })  // N queries
}

// GOOD — single query
const posts = await db.post.findMany({
  where: { userId },
  include: { user: { select: { id: true, name: true, avatarUrl: true } } }
})

// GOOD — for complex joins, drop to raw SQL
const result = await db.$queryRaw<PostWithStats[]>`
  SELECT p.id, p.title, COUNT(c.id)::int AS comment_count
  FROM posts p
  LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
  WHERE p.user_id = ${userId}
    AND p.deleted_at IS NULL
  GROUP BY p.id
  ORDER BY p.created_at DESC
  LIMIT ${limit}
`
```

### Transactions

```typescript
// Use $transaction for multi-table writes
export async function publishPost(postId: string, userId: string) {
  return db.$transaction(async (trx) => {
    const post = await trx.post.findFirst({
      where: { id: postId, userId, deletedAt: null }
    })
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found')
    if (post.status === 'published') return post  // idempotent

    const updated = await trx.post.update({
      where: { id: postId },
      data: { status: 'published', publishedAt: new Date() }
    })

    await trx.activityLog.create({
      data: { userId, action: 'post.published', resourceId: postId }
    })

    return updated
  })
}
```

### Soft Deletes — Always Filter in Queries

```typescript
// Create a reusable where clause
const notDeleted = { deletedAt: null }

// BAD — forgets soft delete filter
const post = await db.post.findUnique({ where: { id } })

// GOOD
const post = await db.post.findFirst({ where: { id, ...notDeleted } })

// SOFT DELETE implementation
export async function deletePost(id: string, userId: string) {
  const post = await db.post.findFirst({ where: { id, userId, deletedAt: null } })
  if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found')

  return db.post.update({
    where: { id },
    data: { deletedAt: new Date() }
  })
}
```

---

## Migrations — Zero-Downtime Rules

**Safe to run on live traffic:**
- Add nullable column
- Add column with default
- Add index (run `CREATE INDEX CONCURRENTLY` in raw migration)
- Add table
- Add FK (with index already in place)

**Requires maintenance window or phased deploy:**
- Remove column (deploy code that ignores it first, then drop)
- Rename column (add new → backfill → switch reads → drop old)
- Change column type
- Add NOT NULL to existing column (backfill nulls first)

**Prisma raw migration for `CONCURRENTLY`:**
```sql
-- In migration.sql, replace Prisma's generated CREATE INDEX with:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created 
ON posts(user_id, created_at DESC);
```

---

## Connection Pool

```typescript
// src/lib/db.ts — for production
export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})
// Prisma manages its own pool. Configure via DATABASE_URL:
// postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20
// connection_limit = (Postgres max_connections - 5) / number_of_app_instances
```

---

## Performance Checklist

Before shipping any new query, verify:
1. `EXPLAIN ANALYZE` on realistic data volume (not dev sample data)
2. No sequential scans on tables > 10k rows
3. No N+1 patterns
4. Uses cursor pagination if returning a list
5. Selects only needed columns (no `select *` across wide tables)
