'use client'

import { motion } from 'framer-motion'

import type { Severity, TopIpRow } from '@/lib/api'
import {
  algorithmColor,
  isDeprecatedAlgorithm,
} from '@/components/dashboard/chartTheme'
import SeverityBadge from '@/components/shared/severityBadge'

interface IPCardProps {
  row: TopIpRow
  index: number
}

const SEVERITY_KEYS: Severity[] = ['info', 'warning', 'critical']

export function IPCard({ row, index }: IPCardProps) {
  const hasDeprecated = row.topAlgorithms.some((a) =>
    isDeprecatedAlgorithm(a.algorithm)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`bg-card rounded-xl border p-5 ${
        hasDeprecated ? 'border-destructive/30' : 'border-border'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-muted-foreground font-mono text-[10px]">
              IP
            </span>
          </div>
          <div>
            <p className="text-foreground font-mono text-sm font-semibold">
              {row.sourceIp}
            </p>
            <p className="text-muted-foreground text-xs">{row.total} events</p>
          </div>
        </div>
        {hasDeprecated && (
          <span className="text-destructive bg-destructive/10 border-destructive/20 rounded-full border px-2 py-1 text-[10px] font-medium">
            Deprecated algo
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {SEVERITY_KEYS.map((sev) => {
          const count = row[sev]
          if (count === 0) return null
          return (
            <div key={sev} className="flex items-center gap-1.5">
              <SeverityBadge severity={sev} />
              <span className="text-muted-foreground font-mono text-xs">
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {row.topAlgorithms.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
            Top Algorithms
          </p>
          {row.topAlgorithms.map(({ algorithm, count }) => {
            const isDeprecated = isDeprecatedAlgorithm(algorithm)
            const color = algorithmColor(algorithm)
            const pct = Math.round((count / row.total) * 100)
            return (
              <div key={algorithm} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs" style={{ color }}>
                    {algorithm}
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="bg-muted h-1 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      opacity: isDeprecated ? 0.75 : 0.6,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
