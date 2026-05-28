export type Severity = 'info' | 'warning' | 'critical'
export type EventType = 'observed' | 'rotation' | 'expiration-warning' | 'error'

export interface CryptoEvent {
  id: string
  assetId: string
  assetType: string
  algorithm: string
  severity: Severity
  sourceIp: string
  observedAt: string
  eventType: EventType
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface EventsResponse {
  data: CryptoEvent[]
  pagination: Pagination
}

export interface EventsPerDayRow {
  date: string
  count: number
}

export interface EventsOverTimeRow {
  date: string
  info: number
  warning: number
  critical: number
  total: number
}

export interface ByAlgorithmRow {
  algorithm: string
  severity: Severity
  count: number
}

export interface InventoryKeyRow {
  algorithm: string
  assetType: string
  severity: Severity
  count: number
}

export interface SummaryStats {
  totalEvents: number
  criticalEvents: number
  warningEvents: number
  uniqueSourceIps: number
}

export interface TopIpAlgorithm {
  algorithm: string
  count: number
}

export interface TopIpRow {
  sourceIp: string
  total: number
  critical: number
  warning: number
  info: number
  topAlgorithms: TopIpAlgorithm[]
}

export interface EventsQuery {
  assetType?: string
  algorithm?: string
  severity?: Severity
  from?: string
  to?: string
  page?: number
  limit?: number
}
