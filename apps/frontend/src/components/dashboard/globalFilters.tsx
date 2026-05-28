'use client'

import React from 'react'

import type { Severity } from '@cryptonext/shared'
import { Button } from '@cryptonext/ui/button'
import { Calendar } from '@cryptonext/ui/calendar'
import { Input } from '@cryptonext/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cryptonext/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cryptonext/ui/select'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { CalendarIcon, Search, X } from 'lucide-react'

const DEFAULT_RANGE_START = new Date('2026-01-01T00:00:00.000Z')

import { api } from '@/lib/api'

export interface DashboardFilters {
  search: string
  algorithm: string | 'all'
  severity: Severity | 'all'
  from?: Date
  to?: Date
}

export const DEFAULT_FILTERS: DashboardFilters = {
  search: '',
  algorithm: 'all',
  severity: 'all',
  from: DEFAULT_RANGE_START,
  to: new Date(),
}

const SEVERITIES: Severity[] = ['info', 'warning', 'critical']

const QUICK_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const

export function GlobalFilters({
  filters,
  onChange,
  extras,
}: {
  filters: DashboardFilters
  onChange: (filters: DashboardFilters) => void
  /**
   * Page-specific controls (e.g. a sort selector) rendered inline with the
   * shared filter bar so consumers don't introduce a second floating Select.
   */
  extras?: React.ReactNode
}) {
  const { data: algorithmsData } = useQuery({
    queryKey: ['stats', 'algorithms'],
    queryFn: () => api.stats.algorithms(),
    staleTime: 5 * 60 * 1000,
  })

  const algorithms = algorithmsData?.data ?? []

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  const applyQuickRange = (days: number) => {
    onChange({
      ...filters,
      from: subDays(new Date(), days - 1),
      to: new Date(),
    })
  }

  const hasActiveFilters =
    filters.algorithm !== 'all' ||
    filters.severity !== 'all' ||
    filters.search !== '' ||
    filters.from !== undefined ||
    filters.to !== undefined

  const clearFilters = () => onChange(DEFAULT_FILTERS)

  const dateLabel = (() => {
    if (filters.from && filters.to) {
      return `${format(filters.from, 'MMM d')} - ${format(filters.to, 'MMM d, yyyy')}`
    }
    if (filters.from) return `From ${format(filters.from, 'MMM d, yyyy')}`
    if (filters.to) return `Until ${format(filters.to, 'MMM d, yyyy')}`
    return 'All time'
  })()

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search asset, IP, algorithm..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="bg-muted border-border h-9 pl-9 text-sm"
          />
        </div>

        {/* Algorithm Filter */}
        <Select
          value={filters.algorithm}
          onValueChange={(v) => updateFilter('algorithm', v)}
        >
          <SelectTrigger className="bg-muted border-border h-9 w-[160px] text-sm">
            <SelectValue placeholder="Algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Algorithms</SelectItem>
            {algorithms.map((a) => (
              <SelectItem key={a} value={a}>
                <span className="font-mono text-xs">{a}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity Filter */}
        <Select
          value={filters.severity}
          onValueChange={(v) =>
            updateFilter('severity', v as Severity | 'all')
          }
        >
          <SelectTrigger className="bg-muted border-border h-9 w-[140px] text-sm">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>
                <span className="capitalize">{s}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {extras}

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-muted border-border h-9 justify-start text-left text-sm font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="mb-3 flex gap-2">
              {QUICK_RANGES.map((r) => (
                <Button
                  key={r.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => applyQuickRange(r.days)}
                  className="h-8 text-xs"
                >
                  Last {r.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={{ from: filters.from, to: filters.to }}
              onSelect={(range) => {
                onChange({
                  ...filters,
                  from: range?.from,
                  to: range?.to,
                })
              }}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground h-9 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
