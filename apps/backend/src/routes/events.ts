import { zValidator } from '@hono/zod-validator'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/index.js'
import { cryptoEvents } from '../db/schema.js'
import { eventsQuerySchema } from '../validators/events.js'

export const eventsRouter = new Hono()

eventsRouter.get('/', zValidator('query', eventsQuerySchema), async (c) => {
  const { assetType, algorithm, severity, from, to, page, limit } =
    c.req.valid('query')

  const conditions = []

  if (assetType) conditions.push(eq(cryptoEvents.assetType, assetType))
  if (algorithm) conditions.push(eq(cryptoEvents.algorithm, algorithm))
  if (severity) conditions.push(eq(cryptoEvents.severity, severity))
  if (from) conditions.push(gte(cryptoEvents.observedAt, new Date(from)))
  if (to) conditions.push(lte(cryptoEvents.observedAt, new Date(to)))

  const offset = (page - 1) * limit

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(cryptoEvents)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(cryptoEvents.observedAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cryptoEvents)
      .where(and(...conditions)),
  ])

  const total = countResult[0]?.count ?? 0

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})
