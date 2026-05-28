import 'dotenv/config'

import { db } from './index.js'
import { cryptoEvents } from './schema.js'

const ALGORITHMS = [
  'RSA2048',
  'RSA1024',
  'RSA4096',
  'ECDSAP256',
  'ECDSAP384',
  'Ed25519',
  'SHA1',
  'SHA256',
  '3DES',
  'AES128',
  'AES256',
]

const ASSET_TYPES = ['certificate', 'ssh-key', 'api-key', 'tls-cert', 'pgp-key']

const SEVERITIES = ['info', 'warning', 'critical'] as const

const EVENT_TYPES = [
  'observed',
  'rotation',
  'expiration-warning',
  'error',
] as const

const SOURCE_IPS = [
  '192.168.1.10',
  '192.168.1.25',
  '10.0.0.5',
  '10.0.0.42',
  '172.16.0.8',
  '172.16.0.99',
  '203.0.113.50',
]

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

const SEED_COUNT = 1000
const RANGE_START = new Date('2026-01-01T00:00:00.000Z')
const RANGE_END = new Date('2026-05-28T23:59:59.999Z')

async function main() {
  const events = Array.from({ length: SEED_COUNT }, (_, i) => ({
    id: generateId(),
    assetId: `asset-${String(i + 1).padStart(4, '0')}`,
    assetType: randomItem(ASSET_TYPES),
    algorithm: randomItem(ALGORITHMS),
    severity: randomItem(SEVERITIES),
    sourceIp: randomItem(SOURCE_IPS),
    observedAt: randomDate(RANGE_START, RANGE_END),
    eventType: randomItem(EVENT_TYPES),
  }))

  await db.delete(cryptoEvents)
  await db.insert(cryptoEvents).values(events)

  console.log(`Seeded ${events.length} crypto events successfully.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
