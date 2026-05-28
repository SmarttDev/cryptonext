import { describe, expect, it } from 'vitest'

import { app } from '../index.js'

interface ApiResponse<T> {
  data: T
}

async function getJson<T>(path: string): Promise<ApiResponse<T>> {
  const res = await app.request(path)
  expect(res.status).toBe(200)
  return (await res.json()) as ApiResponse<T>
}

describe('GET /stats/events-per-day', () => {
  it('returns a row per day with totals across the fixture range', async () => {
    const { data } = await getJson<{ date: string; count: number }[]>(
      '/stats/events-per-day'
    )
    expect(data).toHaveLength(3)
    const byDate = Object.fromEntries(data.map((r) => [r.date, r.count]))
    expect(byDate['2026-01-01']).toBe(3)
    expect(byDate['2026-01-02']).toBe(3)
    expect(byDate['2026-01-03']).toBe(4)
  })

  it('applies severity + date filters', async () => {
    const { data } = await getJson<{ date: string; count: number }[]>(
      '/stats/events-per-day?severity=critical&from=2026-01-02&to=2026-01-03T23:59:59Z'
    )
    expect(data.find((r) => r.date === '2026-01-01')).toBeUndefined()
    const total = data.reduce((acc, r) => acc + r.count, 0)
    // 3 critical events on 01-02 / 01-03 (evt-005, evt-008, evt-009)
    expect(total).toBe(3)
  })

  it('applies search filter via ILIKE across asset_id / source_ip / algorithm / asset_type', async () => {
    const { data } = await getJson<{ date: string; count: number }[]>(
      '/stats/events-per-day?search=ssh-key'
    )
    expect(data.reduce((acc, r) => acc + r.count, 0)).toBe(2)
  })
})

describe('GET /stats/events-over-time', () => {
  it('breaks counts down by severity in a single pass', async () => {
    const { data } = await getJson<
      {
        date: string
        info: number
        warning: number
        critical: number
        total: number
      }[]
    >('/stats/events-over-time')
    const day1 = data.find((r) => r.date === '2026-01-01')!
    expect(day1).toMatchObject({
      info: 2,
      warning: 0,
      critical: 1,
      total: 3,
    })
    const day3 = data.find((r) => r.date === '2026-01-03')!
    expect(day3).toMatchObject({
      info: 2,
      warning: 0,
      critical: 2,
      total: 4,
    })
  })
})

describe('GET /stats/by-algorithm', () => {
  it('groups by algorithm and severity', async () => {
    const { data } = await getJson<
      { algorithm: string; severity: string; count: number }[]
    >('/stats/by-algorithm')
    const key = (a: string, s: string) =>
      data.find((r) => r.algorithm === a && r.severity === s)?.count ?? 0
    expect(key('RSA2048', 'info')).toBe(3) // evt-001, evt-007, evt-010
    expect(key('RSA1024', 'critical')).toBe(3) // evt-002, evt-008, evt-009
    expect(key('SHA1', 'warning')).toBe(1)
    expect(key('SHA1', 'critical')).toBe(1)
    expect(key('Ed25519', 'info')).toBe(1)
    expect(key('Ed25519', 'warning')).toBe(1)
  })

  it('orders rows by count descending', async () => {
    const { data } = await getJson<{ count: number }[]>('/stats/by-algorithm')
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].count).toBeGreaterThanOrEqual(data[i].count)
    }
  })
})

describe('GET /stats/algorithms', () => {
  it('returns the distinct algorithm names sorted', async () => {
    const { data } = await getJson<string[]>('/stats/algorithms')
    expect(data).toEqual(['Ed25519', 'RSA1024', 'RSA2048', 'SHA1'])
  })
})

describe('GET /stats/inventory-keys', () => {
  it('applies algorithm list + assetType filters', async () => {
    const { data } = await getJson<
      {
        algorithm: string
        assetType: string
        severity: string
        count: number
      }[]
    >('/stats/inventory-keys?assetType=certificate&algorithms=RSA1024,RSA2048')
    // RSA2048 / certificate / info → evt-001, evt-007, evt-010 (3)
    // RSA1024 / certificate / critical → evt-002, evt-008, evt-009 (3)
    expect(data).toEqual(
      expect.arrayContaining([
        { algorithm: 'RSA2048', assetType: 'certificate', severity: 'info', count: 3 },
        {
          algorithm: 'RSA1024',
          assetType: 'certificate',
          severity: 'critical',
          count: 3,
        },
      ])
    )
    expect(data).toHaveLength(2)
  })

  it('applies year filter', async () => {
    const { data: in2026 } = await getJson<unknown[]>(
      '/stats/inventory-keys?year=2026'
    )
    expect(in2026.length).toBeGreaterThan(0)
    const { data: in2025 } = await getJson<unknown[]>(
      '/stats/inventory-keys?year=2025'
    )
    expect(in2025).toEqual([])
  })
})

describe('GET /stats/top-source-ips', () => {
  it('returns top N IPs with severity counters + topAlgorithms', async () => {
    const { data } = await getJson<
      {
        sourceIp: string
        total: number
        info: number
        warning: number
        critical: number
        topAlgorithms: { algorithm: string; count: number }[]
      }[]
    >('/stats/top-source-ips?limit=10')
    const top = data[0]
    expect(top.sourceIp).toBe('10.0.0.1') // 4 events (evt-001, evt-002, evt-007, evt-010)
    expect(top.total).toBe(4)
    expect(top.info).toBe(3)
    expect(top.critical).toBe(1)
    expect(top.topAlgorithms[0]).toEqual({ algorithm: 'RSA2048', count: 3 })
  })

  it('respects the limit parameter', async () => {
    const { data } = await getJson<unknown[]>('/stats/top-source-ips?limit=2')
    expect(data).toHaveLength(2)
  })

  it('filters reduce the result set', async () => {
    const { data } = await getJson<{ sourceIp: string }[]>(
      '/stats/top-source-ips?severity=critical&limit=10'
    )
    const ips = data.map((r) => r.sourceIp).sort()
    expect(ips).toEqual(['10.0.0.1', '10.0.0.3', '10.0.0.4'])
  })
})

describe('GET /stats/summary', () => {
  it('returns totals + severity + unique IP counts', async () => {
    const { data } = await getJson<{
      totalEvents: number
      criticalEvents: number
      warningEvents: number
      uniqueSourceIps: number
    }>('/stats/summary')
    expect(data).toEqual({
      totalEvents: 10,
      criticalEvents: 4,
      warningEvents: 2,
      uniqueSourceIps: 4,
    })
  })
})

describe('GET /events', () => {
  it('paginates and returns metadata', async () => {
    const res = await app.request('/events?limit=3&page=1')
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: unknown[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
    expect(body.data).toHaveLength(3)
    expect(body.pagination).toEqual({
      page: 1,
      limit: 3,
      total: 10,
      totalPages: 4,
    })
  })

  it('rejects an invalid severity with a 400', async () => {
    const res = await app.request('/events?severity=urgent')
    expect(res.status).toBe(400)
  })
})
