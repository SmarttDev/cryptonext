'use client'

import { useMemo } from 'react'

import { Skeleton } from '@cryptonext/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  severityColors,
  xAxisProps,
  yAxisProps,
} from './chartTheme'

export function ByAlgorithmChart({ filters = {} }: { filters?: StatsFilters }) {
  // The byAlgorithm chart groups data by algorithm, so filtering BY algorithm
  // would collapse the chart to a single bar. We exclude only the algorithm
  // filter, but keep date range, severity and search filters.
  const { algorithm: _ignored, ...byAlgorithmFilters } = filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'by-algorithm', byAlgorithmFilters],
    queryFn: () => api.stats.byAlgorithm(byAlgorithmFilters),
  })

  const chartData = useMemo(() => {
    if (!data?.data) return []
    const grouped = new Map<
      string,
      { algorithm: string; info: number; warning: number; critical: number }
    >()
    for (const row of data.data) {
      if (!grouped.has(row.algorithm)) {
        grouped.set(row.algorithm, {
          algorithm: row.algorithm,
          info: 0,
          warning: 0,
          critical: 0,
        })
      }
      const g = grouped.get(row.algorithm)!
      g[row.severity] = row.count
    }
    return Array.from(grouped.values())
  }, [data])

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-xl" />
  }

  if (error) {
    return (
      <ChartCard>
        <ChartHeader
          title="Events by Algorithm"
          subtitle="Stacked by severity"
        />
        <div className="text-destructive text-sm">Failed to load data</div>
      </ChartCard>
    )
  }

  return (
    <ChartCard>
      <ChartHeader
        title="Events by Algorithm"
        subtitle="Stacked by severity"
        legend={[
          { label: 'Info', color: chartColors.info },
          { label: 'Warning', color: chartColors.warning },
          { label: 'Critical', color: chartColors.critical },
        ]}
      />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="algorithm"
            angle={-45}
            textAnchor="end"
            height={70}
            interval={0}
            {...xAxisProps}
          />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip
            cursor={{ fill: chartColors.grid }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="info"
            stackId="a"
            fill={severityColors.info}
            radius={[0, 0, 0, 0]}
          />
          <Bar dataKey="warning" stackId="a" fill={severityColors.warning} />
          <Bar
            dataKey="critical"
            stackId="a"
            fill={severityColors.critical}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
