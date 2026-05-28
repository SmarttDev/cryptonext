import type {
  ByAlgorithmRow,
  CryptoEvent,
  EventType,
  EventsOverTimeRow,
  EventsPerDayRow,
  EventsQuery,
  EventsResponse,
  InventoryKeyRow,
  Pagination,
  Severity,
  SummaryStats,
  TopIpRow,
} from '@cryptonext/shared'

export type {
  ByAlgorithmRow,
  CryptoEvent,
  EventType,
  EventsOverTimeRow,
  EventsPerDayRow,
  EventsQuery,
  EventsResponse,
  InventoryKeyRow,
  Pagination,
  Severity,
  SummaryStats,
  TopIpRow,
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Common filter shape consumed by the dashboard stats endpoints.
 * `from`/`to` are ISO date strings.
 */
export interface StatsFilters {
  from?: string
  to?: string
  algorithm?: string
  severity?: Severity
  search?: string
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function toQueryString(
  params: Record<string, string | number | undefined> | object
): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v))
  }
  return q.toString() ? `?${q.toString()}` : ''
}

export const api = {
  events: {
    list: (query: EventsQuery = {}) =>
      apiFetch<EventsResponse>(
        `/events${toQueryString(query as Record<string, string | number | undefined>)}`
      ),
  },
  stats: {
    eventsPerDay: (params: StatsFilters = {}) =>
      apiFetch<{ data: EventsPerDayRow[] }>(
        `/stats/events-per-day${toQueryString(params)}`
      ),
    eventsOverTime: (params: StatsFilters = {}) =>
      apiFetch<{ data: EventsOverTimeRow[] }>(
        `/stats/events-over-time${toQueryString(params)}`
      ),
    byAlgorithm: (params: Omit<StatsFilters, 'algorithm'> = {}) =>
      apiFetch<{ data: ByAlgorithmRow[] }>(
        `/stats/by-algorithm${toQueryString(params)}`
      ),
    algorithms: () => apiFetch<{ data: string[] }>('/stats/algorithms'),
    inventoryKeys: (
      params: {
        assetType?: string
        severity?: Severity
        year?: number
        algorithms?: string
      } = {}
    ) =>
      apiFetch<{ data: InventoryKeyRow[] }>(
        `/stats/inventory-keys${toQueryString(params as Record<string, string | number | undefined>)}`
      ),
    topSourceIps: (params: StatsFilters & { limit?: number } = {}) =>
      apiFetch<{ data: TopIpRow[] }>(
        `/stats/top-source-ips${toQueryString(params as Record<string, string | number | undefined>)}`
      ),
    summary: (params: StatsFilters = {}) =>
      apiFetch<{ data: SummaryStats }>(
        `/stats/summary${toQueryString(params)}`
      ),
  },
}
