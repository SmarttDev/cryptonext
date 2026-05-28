import { zValidator } from '@hono/zod-validator'
import { and, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '../db/index.js'
import { cryptoEvents } from '../db/schema.js'
import {
  byAlgorithmQuerySchema,
  eventsOverTimeQuerySchema,
  eventsPerDayQuerySchema,
  inventoryKeysQuerySchema,
  summaryQuerySchema,
  topIpsQuerySchema,
} from '../validators/events.js'

export const statsRouter = new Hono()

/**
 * Build the common WHERE conditions used by all aggregation endpoints.
 * Centralizes from/to/algorithm/severity/search handling.
 */
function buildCommonConditions({
  from,
  to,
  algorithm,
  severity,
  search,
}: {
  from?: string
  to?: string
  algorithm?: string
  severity?: 'info' | 'warning' | 'critical'
  search?: string
}) {
  const conditions = []
  if (from) conditions.push(gte(cryptoEvents.observedAt, new Date(from)))
  if (to) conditions.push(lte(cryptoEvents.observedAt, new Date(to)))
  if (algorithm) conditions.push(eq(cryptoEvents.algorithm, algorithm))
  if (severity) conditions.push(eq(cryptoEvents.severity, severity))
  if (search) {
    const pattern = `%${search}%`
    const searchCondition = or(
      ilike(cryptoEvents.assetId, pattern),
      ilike(cryptoEvents.sourceIp, pattern),
      ilike(cryptoEvents.algorithm, pattern),
      ilike(cryptoEvents.assetType, pattern)
    )
    if (searchCondition) conditions.push(searchCondition)
  }
  return conditions
}

statsRouter.get(
  '/events-per-day',
  zValidator('query', eventsPerDayQuerySchema),
  async (c) => {
    const conditions = buildCommonConditions(c.req.valid('query'))

    const rows = await db
      .select({
        date: sql<string>`${cryptoEvents.observedAt}::date`,
        count: sql<number>`count(*)::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))
      .groupBy(sql`${cryptoEvents.observedAt}::date`)
      .orderBy(sql`${cryptoEvents.observedAt}::date`)

    return c.json({ data: rows })
  }
)

statsRouter.get(
  '/events-over-time',
  zValidator('query', eventsOverTimeQuerySchema),
  async (c) => {
    const conditions = buildCommonConditions(c.req.valid('query'))

    const rows = await db
      .select({
        date: sql<string>`${cryptoEvents.observedAt}::date`,
        info: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'info')::int`,
        warning: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'warning')::int`,
        critical: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'critical')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))
      .groupBy(sql`${cryptoEvents.observedAt}::date`)
      .orderBy(sql`${cryptoEvents.observedAt}::date`)

    return c.json({ data: rows })
  }
)

statsRouter.get(
  '/by-algorithm',
  zValidator('query', byAlgorithmQuerySchema),
  async (c) => {
    const conditions = buildCommonConditions(c.req.valid('query'))

    const rows = await db
      .select({
        algorithm: cryptoEvents.algorithm,
        severity: cryptoEvents.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))
      .groupBy(cryptoEvents.algorithm, cryptoEvents.severity)
      .orderBy(sql`count(*)::int desc`)

    return c.json({ data: rows })
  }
)

statsRouter.get('/algorithms', async (c) => {
  const rows = await db
    .selectDistinct({ algorithm: cryptoEvents.algorithm })
    .from(cryptoEvents)
    .orderBy(cryptoEvents.algorithm)

  return c.json({ data: rows.map((r) => r.algorithm) })
})

statsRouter.get(
  '/inventory-keys',
  zValidator('query', inventoryKeysQuerySchema),
  async (c) => {
    const { assetType, severity, year, algorithms } = c.req.valid('query')

    const conditions = []
    if (assetType) conditions.push(eq(cryptoEvents.assetType, assetType))
    if (severity) conditions.push(eq(cryptoEvents.severity, severity))
    if (year) {
      conditions.push(gte(cryptoEvents.observedAt, new Date(`${year}-01-01`)))
      conditions.push(
        lte(cryptoEvents.observedAt, new Date(`${year}-12-31T23:59:59`))
      )
    }
    if (algorithms) {
      const algList = algorithms.split(',').map((a) => a.trim())
      conditions.push(inArray(cryptoEvents.algorithm, algList))
    }

    const rows = await db
      .select({
        algorithm: cryptoEvents.algorithm,
        assetType: cryptoEvents.assetType,
        severity: cryptoEvents.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))
      .groupBy(
        cryptoEvents.algorithm,
        cryptoEvents.assetType,
        cryptoEvents.severity
      )
      .orderBy(sql`count(*)::int desc`)

    return c.json({ data: rows })
  }
)

statsRouter.get(
  '/top-source-ips',
  zValidator('query', topIpsQuerySchema),
  async (c) => {
    const { limit, ...filters } = c.req.valid('query')
    const conditions = buildCommonConditions(filters)

    const ipRows = await db
      .select({
        sourceIp: cryptoEvents.sourceIp,
        total: sql<number>`count(*)::int`,
        critical: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'critical')::int`,
        warning: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'warning')::int`,
        info: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'info')::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))
      .groupBy(cryptoEvents.sourceIp)
      .orderBy(sql`count(*)::int desc`)
      .limit(limit)

    if (ipRows.length === 0) {
      return c.json({ data: [] })
    }

    const ipList = ipRows.map((r) => r.sourceIp)
    const algoRows = await db
      .select({
        sourceIp: cryptoEvents.sourceIp,
        algorithm: cryptoEvents.algorithm,
        count: sql<number>`count(*)::int`,
      })
      .from(cryptoEvents)
      .where(and(inArray(cryptoEvents.sourceIp, ipList), ...conditions))
      .groupBy(cryptoEvents.sourceIp, cryptoEvents.algorithm)
      .orderBy(sql`count(*)::int desc`)

    const algosByIp = new Map<string, { algorithm: string; count: number }[]>()
    for (const row of algoRows) {
      const bucket = algosByIp.get(row.sourceIp)
      if (bucket) {
        if (bucket.length < 5)
          bucket.push({ algorithm: row.algorithm, count: row.count })
      } else {
        algosByIp.set(row.sourceIp, [
          { algorithm: row.algorithm, count: row.count },
        ])
      }
    }

    const data = ipRows.map((row) => ({
      ...row,
      topAlgorithms: algosByIp.get(row.sourceIp) ?? [],
    }))

    return c.json({ data })
  }
)

statsRouter.get(
  '/summary',
  zValidator('query', summaryQuerySchema),
  async (c) => {
    const conditions = buildCommonConditions(c.req.valid('query'))

    const [row] = await db
      .select({
        totalEvents: sql<number>`count(*)::int`,
        criticalEvents: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'critical')::int`,
        warningEvents: sql<number>`count(*) filter (where ${cryptoEvents.severity} = 'warning')::int`,
        uniqueSourceIps: sql<number>`count(distinct ${cryptoEvents.sourceIp})::int`,
      })
      .from(cryptoEvents)
      .where(and(...conditions))

    return c.json({ data: row })
  }
)

