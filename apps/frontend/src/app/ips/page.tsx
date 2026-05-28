'use client'

import { useMemo, useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cryptonext/ui/select'
import { useQuery } from '@tanstack/react-query'

import {
  DEFAULT_FILTERS,
  type DashboardFilters,
  GlobalFilters,
} from '@/components/dashboard/globalFilters'
import { IPCard } from '@/components/ip/iPCard'
import { LoadingState } from '@/components/shared/loadingState'
import { type StatsFilters, type TopIpRow, api } from '@/lib/api'

type SortBy = 'count' | 'critical' | 'ip'

const TOP_IPS_LIMIT = 50

function toApiFilters(filters: DashboardFilters): StatsFilters {
  return {
    algorithm: filters.algorithm === 'all' ? undefined : filters.algorithm,
    severity: filters.severity === 'all' ? undefined : filters.severity,
    search: filters.search || undefined,
    from: filters.from ? filters.from.toISOString() : undefined,
    to: filters.to ? filters.to.toISOString() : undefined,
  }
}

export default function IPAnalysis() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('count')

  const apiFilters = useMemo(() => toApiFilters(filters), [filters])

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'top-source-ips', apiFilters],
    queryFn: () =>
      api.stats.topSourceIps({ ...apiFilters, limit: TOP_IPS_LIMIT }),
  })

  const rows = data?.data ?? []

  const sorted = useMemo<TopIpRow[]>(() => {
    const arr = [...rows]
    if (sortBy === 'count') {
      arr.sort((a, b) => b.total - a.total)
    } else if (sortBy === 'critical') {
      arr.sort((a, b) => b.critical - a.critical)
    } else {
      arr.sort((a, b) => a.sourceIp.localeCompare(b.sourceIp))
    }
    return arr
  }, [rows, sortBy])

  if (isLoading) return <LoadingState />

  const sortControl = (
    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
      <SelectTrigger className="bg-muted border-border h-9 w-[160px] text-sm">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="count">Most Events</SelectItem>
        <SelectItem value="critical">Most Critical</SelectItem>
        <SelectItem value="ip">IP Address</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          IP Analysis
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Top {sorted.length} source IPs — events grouped by origin
        </p>
      </div>

      <GlobalFilters
        filters={filters}
        onChange={setFilters}
        extras={sortControl}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((row, i) => (
          <IPCard key={row.sourceIp} row={row} index={i} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-muted-foreground py-12 text-center text-sm">
          No IPs match your filters
        </div>
      )}
    </div>
  )
}
