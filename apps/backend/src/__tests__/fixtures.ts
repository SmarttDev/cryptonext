import type { InferInsertModel } from 'drizzle-orm'

import { cryptoEvents } from '../db/schema.js'

type Row = InferInsertModel<typeof cryptoEvents>

const d = (iso: string) => new Date(iso)

/**
 * Deterministic event set used by every test. Covers:
 *  - 4 algorithms, 2 of them deprecated (RSA1024, SHA1).
 *  - 3 severities.
 *  - 4 event types.
 *  - 4 source IPs.
 *  - Dates spread across 3 consecutive days in Jan 2026.
 */
export const FIXTURE_EVENTS: Row[] = [
  // 2026-01-01
  {
    id: 'evt-001',
    assetId: 'asset-aaa',
    assetType: 'certificate',
    algorithm: 'RSA2048',
    severity: 'info',
    sourceIp: '10.0.0.1',
    observedAt: d('2026-01-01T08:00:00Z'),
    eventType: 'observed',
  },
  {
    id: 'evt-002',
    assetId: 'asset-aaa',
    assetType: 'certificate',
    algorithm: 'RSA1024',
    severity: 'critical',
    sourceIp: '10.0.0.1',
    observedAt: d('2026-01-01T09:30:00Z'),
    eventType: 'error',
  },
  {
    id: 'evt-003',
    assetId: 'asset-bbb',
    assetType: 'ssh-key',
    algorithm: 'Ed25519',
    severity: 'info',
    sourceIp: '10.0.0.2',
    observedAt: d('2026-01-01T10:00:00Z'),
    eventType: 'rotation',
  },
  // 2026-01-02
  {
    id: 'evt-004',
    assetId: 'asset-ccc',
    assetType: 'api-key',
    algorithm: 'SHA1',
    severity: 'warning',
    sourceIp: '10.0.0.3',
    observedAt: d('2026-01-02T11:00:00Z'),
    eventType: 'expiration-warning',
  },
  {
    id: 'evt-005',
    assetId: 'asset-ccc',
    assetType: 'api-key',
    algorithm: 'SHA1',
    severity: 'critical',
    sourceIp: '10.0.0.3',
    observedAt: d('2026-01-02T12:00:00Z'),
    eventType: 'error',
  },
  {
    id: 'evt-006',
    assetId: 'asset-bbb',
    assetType: 'ssh-key',
    algorithm: 'Ed25519',
    severity: 'warning',
    sourceIp: '10.0.0.2',
    observedAt: d('2026-01-02T13:00:00Z'),
    eventType: 'observed',
  },
  // 2026-01-03
  {
    id: 'evt-007',
    assetId: 'asset-aaa',
    assetType: 'certificate',
    algorithm: 'RSA2048',
    severity: 'info',
    sourceIp: '10.0.0.1',
    observedAt: d('2026-01-03T14:00:00Z'),
    eventType: 'observed',
  },
  {
    id: 'evt-008',
    assetId: 'asset-ddd',
    assetType: 'certificate',
    algorithm: 'RSA1024',
    severity: 'critical',
    sourceIp: '10.0.0.4',
    observedAt: d('2026-01-03T15:00:00Z'),
    eventType: 'error',
  },
  {
    id: 'evt-009',
    assetId: 'asset-ddd',
    assetType: 'certificate',
    algorithm: 'RSA1024',
    severity: 'critical',
    sourceIp: '10.0.0.4',
    observedAt: d('2026-01-03T16:00:00Z'),
    eventType: 'error',
  },
  {
    id: 'evt-010',
    assetId: 'asset-aaa',
    assetType: 'certificate',
    algorithm: 'RSA2048',
    severity: 'info',
    sourceIp: '10.0.0.1',
    observedAt: d('2026-01-03T17:00:00Z'),
    eventType: 'rotation',
  },
]
