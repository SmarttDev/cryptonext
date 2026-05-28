import { sql } from 'drizzle-orm'
import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const cryptoEvents = pgTable(
  'crypto_events',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    assetId: varchar('asset_id', { length: 100 }).notNull(),
    assetType: varchar('asset_type', { length: 50 }).notNull(),
    algorithm: varchar('algorithm', { length: 50 }).notNull(),
    severity: varchar('severity', {
      enum: ['info', 'warning', 'critical'] as const,
    }).notNull(),
    sourceIp: varchar('source_ip', { length: 45 }).notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    eventType: varchar('event_type', {
      enum: ['observed', 'rotation', 'expiration-warning', 'error'] as const,
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_algorithm').on(table.algorithm),
    index('idx_severity').on(table.severity),
    index('idx_asset_type').on(table.assetType),
    index('idx_observed_at').on(table.observedAt),
    index('idx_source_ip').on(table.sourceIp),
    index('idx_event_type').on(table.eventType),
  ]
)
