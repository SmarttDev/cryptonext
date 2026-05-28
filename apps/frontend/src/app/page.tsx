'use client'

import { useMemo, useState } from 'react'

import { Skeleton } from '@cryptonext/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { Activity, AlertTriangle, Server, ShieldAlert } from 'lucide-react'

import { ByAlgorithmChart } from '@/components/dashboard/byAlgorithmChart'
import { EventsPerDayChart } from '@/components/dashboard/eventsPerDayChart'
import { EventsTimelineChart } from '@/components/dashboard/eventsTimelineChart'
import {
  DEFAULT_FILTERS,
  type DashboardFilters,
  GlobalFilters,
} from '@/components/dashboard/globalFilters'
import { StatCard } from '@/components/dashboard/statCard'
import { type StatsFilters, api } from '@/lib/api'

/** Convert UI filters into the shape expected by the stats API endpoints. */
function toApiFilters(filters: DashboardFilters): StatsFilters {
  return {
    algorithm: filters.algorithm === 'all' ? undefined : filters.algorithm,
    severity: filters.severity === 'all' ? undefined : filters.severity,
    search: filters.search || undefined,
    from: filters.from ? filters.from.toISOString() : undefined,
    to: filters.to ? filters.to.toISOString() : undefined,
  }
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)

  const apiFilters = useMemo(() => toApiFilters(filters), [filters])

  // Number of days covered by the selected range, used by the timeline chart
  // to render an axis with one tick per day even if some days have no data.
  const rangeDays = useMemo(() => {
    if (filters.from && filters.to) {
      return Math.max(1, differenceInCalendarDays(filters.to, filters.from) + 1)
    }
    return 30
  }, [filters.from, filters.to])

  const { data: statsSummary, isLoading: isLoadingStatsSummary } = useQuery({
    queryKey: ['stats', 'summary', apiFilters],
    queryFn: () => api.stats.summary(apiFilters),
  })

  const summary = statsSummary?.data

  const { data: eventsOverTime, isLoading: isLoadingEventsOverTime } = useQuery(
    {
      queryKey: ['stats', 'events-over-time', apiFilters],
      queryFn: () => api.stats.eventsOverTime(apiFilters),
    }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Crypto event analytics overview
        </p>
      </div>

      {/* Global Filters */}
      <GlobalFilters filters={filters} onChange={setFilters} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoadingStatsSummary ? (
          <>
            <Skeleton className="h-[106px] rounded-xl" />
            <Skeleton className="h-[106px] rounded-xl" />
            <Skeleton className="h-[106px] rounded-xl" />
            <Skeleton className="h-[106px] rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Events"
              value={summary?.totalEvents.toLocaleString() ?? '-'}
              icon={Activity}
              variant="primary"
            />
            <StatCard
              label="Critical Events"
              value={summary?.criticalEvents.toLocaleString() ?? '-'}
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              label="Warning Events"
              value={summary?.warningEvents.toLocaleString() ?? '-'}
              icon={ShieldAlert}
              variant="warning"
            />
            <StatCard
              label="Unique Source IPs"
              value={summary?.uniqueSourceIps.toLocaleString() ?? '-'}
              icon={Server}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <EventsPerDayChart filters={apiFilters} />
        <ByAlgorithmChart filters={apiFilters} />
      </div>

      <EventsTimelineChart
        data={eventsOverTime?.data ?? []}
        days={rangeDays}
        from={filters.from}
        isLoading={isLoadingEventsOverTime}
      />
    </div>
  )
}
