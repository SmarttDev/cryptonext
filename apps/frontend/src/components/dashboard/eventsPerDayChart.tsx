'use client'

import { Skeleton } from '@cryptonext/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { type StatsFilters, api } from '@/lib/api'

import {
  ChartCard,
  ChartHeader,
  ChartTooltip,
  chartColors,
  gridProps,
  xAxisProps,
  yAxisProps,
} from './chartTheme'

export function EventsPerDayChart({
  filters = {},
}: {
  filters?: StatsFilters
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'events-per-day', filters],
    queryFn: () => api.stats.eventsPerDay(filters),
  })

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-xl" />
  }

  if (error) {
    return (
      <ChartCard>
        <ChartHeader title="Events Per Day" subtitle="Daily event count" />
        <div className="text-destructive text-sm">Failed to load data</div>
      </ChartCard>
    )
  }

  const rows = data?.data ?? []

  return (
    <ChartCard>
      <ChartHeader
        title="Events Per Day"
        subtitle="Daily event count"
        legend={[{ label: 'Events', color: chartColors.primary }]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={rows}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), 'MMM d')}
            interval="preserveStartEnd"
            {...xAxisProps}
          />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={(label) =>
                  format(new Date(label), 'MMM d, yyyy')
                }
              />
            }
          />
          <Line
            type="monotone"
            dataKey="count"
            name="events"
            stroke={chartColors.primary}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
