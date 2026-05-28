import { z } from 'zod'

export const eventsQuerySchema = z.object({
  assetType: z.string().optional(),
  algorithm: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(5000).default(20),
})

export const eventsPerDayQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  algorithm: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})

export const eventsOverTimeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  algorithm: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})

export const byAlgorithmQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})

export const inventoryKeysQuerySchema = z.object({
  assetType: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  year: z.coerce.number().int().optional(),
  algorithms: z.string().optional(),
})

export const topIpsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
  from: z.string().optional(),
  to: z.string().optional(),
  algorithm: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})

export const summaryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  algorithm: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  search: z.string().optional(),
})
