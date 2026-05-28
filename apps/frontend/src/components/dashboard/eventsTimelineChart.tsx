'use client'

import { useMemo } from 'react'

import type { EventsOverTimeRow } from '@cryptonext/shared'
import { Skeleton } from '@cryptonext/ui/skeleton'
import { format, startOfDay, subDays } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartCard,
  ChartHeader,
  ChartTooltip,
  chartColors,
  gridProps,
  xAxisProps,
  yAxisProps,
} from './chartTheme'

interface ChartData {
  date: string
  info: number
  warning: number
  critical: number
  total: number
}

export function EventsTimelineChart({
  data,
  days = 30,
  from,
  isLoading,
}: {
  data: EventsOverTimeRow[]
  days?: number
  /** Start date of the range (defaults to `now - days`). */
  from?: Date
  isLoading?: boolean
}) {
  // Fill missing days with zeros so the chart shows the full range.
  const chartData = useMemo<ChartData[]>(() => {
    const start = from
      ? startOfDay(from)
      : startOfDay(subDays(new Date(), days - 1))
    const dayMap: Record<string, ChartData> = {}

    for (let i = 0; i < days; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      const d = format(date, 'yyyy-MM-dd')
      dayMap[d] = { date: d, info: 0, warning: 0, critical: 0, total: 0 }
    }

    data.forEach((row) => {
      const d = format(new Date(row.date), 'yyyy-MM-dd')
      if (dayMap[d]) {
        dayMap[d] = {
          date: d,
          info: row.info,
          warning: row.warning,
          critical: row.critical,
          total: row.total,
        }
      }
    })

    return Object.values(dayMap)
  }, [data, days, from])

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-xl" />
  }

  return (
    <ChartCard>
      <ChartHeader
        title="Events Over Time"
        subtitle={`Last ${days} days by severity`}
        legend={[
          { label: 'Info', color: chartColors.info },
          { label: 'Warning', color: chartColors.warning },
          { label: 'Critical', color: chartColors.critical },
        ]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="infoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={chartColors.info}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={chartColors.info}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={chartColors.warning}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={chartColors.warning}
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={chartColors.critical}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={chartColors.critical}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), 'MMM d')}
            interval="preserveStartEnd"
            {...xAxisProps}
          />
          <YAxis {...yAxisProps} />
          <Tooltip
            content={
              <ChartTooltip
                labelFormatter={(label) =>
                  format(new Date(label), 'MMM d, yyyy')
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="info"
            stroke={chartColors.info}
            fill="url(#infoGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="warning"
            stroke={chartColors.warning}
            fill="url(#warningGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="critical"
            stroke={chartColors.critical}
            fill="url(#criticalGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
