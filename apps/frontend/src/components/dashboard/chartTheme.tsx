'use client'

import React from 'react'

import type { Severity } from '@cryptonext/shared'

/**
 * Shared color palette across all dashboard charts.
 * Used for colors, gradients, ticks, grid lines and tooltips.
 */
export const chartColors = {
  info: 'hsl(199 89% 48%)',
  warning: 'hsl(38 92% 50%)',
  critical: 'hsl(0 72% 51%)',
  primary: 'hsl(217 91% 60%)',
  grid: 'hsl(222 30% 14%)',
  axisLine: 'hsl(222 30% 16%)',
  axisTick: 'hsl(215 20% 55%)',
} as const

export const severityColors: Record<Severity, string> = {
  info: chartColors.info,
  warning: chartColors.warning,
  critical: chartColors.critical,
}

export const DEPRECATED_ALGORITHMS = [
  'RSA1024',
  'SHA1',
  'MD5',
  'DES',
  '3DES',
  'RC4',
] as const

export function isDeprecatedAlgorithm(algorithm: string): boolean {
  return (DEPRECATED_ALGORITHMS as readonly string[]).includes(algorithm)
}

const ALGORITHM_PALETTE = [
  'hsl(262 83% 65%)',
  'hsl(190 90% 55%)',
  'hsl(168 76% 50%)',
  'hsl(152 65% 55%)',
  'hsl(217 91% 60%)',
  'hsl(330 80% 65%)',
  'hsl(80 60% 55%)',
  'hsl(240 80% 70%)',
  'hsl(28 90% 60%)',
  'hsl(290 70% 65%)',
] as const

/**
 * Returns a stable color for an algorithm name.
 * Deprecated algorithms always render in the destructive (red) hue so the UI
 * flags them visually wherever they appear.
 */
export function algorithmColor(algorithm: string): string {
  if (isDeprecatedAlgorithm(algorithm)) return chartColors.critical
  let hash = 0
  for (let i = 0; i < algorithm.length; i++) {
    hash = (hash * 31 + algorithm.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % ALGORITHM_PALETTE.length
  return ALGORITHM_PALETTE[idx]
}

/** Standardized props for `<CartesianGrid />`. */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: chartColors.grid,
} as const

/** Standardized props for X and Y axes. */
export const xAxisProps = {
  tick: { fontSize: 10, fill: chartColors.axisTick },
  axisLine: { stroke: chartColors.axisLine },
  tickLine: false,
} as const

export const yAxisProps = {
  tick: { fontSize: 10, fill: chartColors.axisTick },
  axisLine: false as const,
  tickLine: false,
  width: 30,
} as const

interface ChartTooltipEntry {
  name?: string | number
  value?: string | number
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipEntry[]
  label?: string | number
  /** Formats the tooltip header (default: renders `label` as-is). */
  labelFormatter?: (label: string | number) => string
  /** Formats the value displayed on the right. */
  valueFormatter?: (value: string | number, name?: string | number) => string
}

/**
 * Consistent tooltip used by all charts.
 * Uses the `bg-card border-border rounded-lg shadow-xl` design with
 * a colored dot for each data series.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const heading =
    label !== undefined && labelFormatter
      ? labelFormatter(label)
      : label !== undefined
        ? String(label)
        : null

  return (
    <div className="bg-card border-border rounded-lg border p-3 shadow-xl">
      {heading && (
        <p className="text-muted-foreground mb-2 font-mono text-xs">
          {heading}
        </p>
      )}
      {payload.map((entry, idx) => (
        <div
          key={`${entry.name ?? idx}`}
          className="flex items-center gap-2 text-xs"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.name !== undefined && (
            <span className="text-muted-foreground capitalize">
              {entry.name}:
            </span>
          )}
          <span className="text-foreground font-mono font-medium">
            {valueFormatter && entry.value !== undefined
              ? valueFormatter(entry.value, entry.name)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface ChartLegendItem {
  label: string
  color: string
}

/** Compact legend (dot + label) aligned to the right. */
export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <div className="flex gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: item.color }}
          />
          <span className="text-muted-foreground text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Shared header: title + subtitle on the left, legend on the right. */
export function ChartHeader({
  title,
  subtitle,
  legend,
}: {
  title: string
  subtitle?: string
  legend?: ChartLegendItem[]
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        )}
      </div>
      {legend && legend.length > 0 && <ChartLegend items={legend} />}
    </div>
  )
}

/** Standardized card container for a chart. */
export function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border-border rounded-xl border p-5">
      {children}
    </div>
  )
}
