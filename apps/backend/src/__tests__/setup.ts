import 'dotenv/config'

import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach } from 'vitest'

// Tests must run against TEST_DATABASE_URL so they can't accidentally wipe a
// real database. We swap DATABASE_URL before any other module loads the db
// singleton.
const url = process.env.TEST_DATABASE_URL
if (!url) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Set it to a throwaway Postgres database — e.g. ' +
      'postgres://cryptonext:cryptonext@localhost:5432/cryptonext_test'
  )
}
process.env.DATABASE_URL = url

/** Ensure the target DB exists; create it via the admin `postgres` DB if not. */
async function ensureDatabase(targetUrl: string): Promise<void> {
  const parsed = new URL(targetUrl)
  const dbName = parsed.pathname.replace(/^\//, '')
  if (!dbName) throw new Error('TEST_DATABASE_URL has no database name')

  const adminUrl = new URL(targetUrl)
  adminUrl.pathname = '/postgres'

  const admin = postgres(adminUrl.toString(), { max: 1 })
  try {
    const rows = await admin<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${dbName}) AS exists
    `
    if (!rows[0]?.exists) {
      // Identifier must be quoted via unsafe — interpolation doesn't work for DDL.
      await admin.unsafe(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
    }
  } finally {
    await admin.end({ timeout: 5 })
  }
}

interface TestDeps {
  db: typeof import('../db/index.js').db
  client: typeof import('../db/index.js').client
  cryptoEvents: typeof import('../db/schema.js').cryptoEvents
  FIXTURE_EVENTS: typeof import('./fixtures.js').FIXTURE_EVENTS
}

let deps: TestDeps

beforeAll(async () => {
  await ensureDatabase(url!)

  // Defer imports until after DATABASE_URL has been swapped and the DB exists.
  const dbModule = await import('../db/index.js')
  const schemaModule = await import('../db/schema.js')
  const fixturesModule = await import('./fixtures.js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')

  deps = {
    db: dbModule.db,
    client: dbModule.client,
    cryptoEvents: schemaModule.cryptoEvents,
    FIXTURE_EVENTS: fixturesModule.FIXTURE_EVENTS,
  }

  // Dynamic and static imports produce subtly different drizzle types under
  // NodeNext's dual resolution mode — runtime is identical, so cast through unknown.
  await migrate(deps.db as unknown as Parameters<typeof migrate>[0], {
    migrationsFolder: './drizzle',
  })
})

beforeEach(async () => {
  await deps.db.delete(deps.cryptoEvents)
  await deps.db.insert(deps.cryptoEvents).values(deps.FIXTURE_EVENTS)
})

afterAll(async () => {
  await deps.client.end({ timeout: 5 })
})
