import React from 'react'

import { motion } from 'framer-motion'

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'primary' | 'warning' | 'danger'
}) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20',
    warning: 'border-warning/20',
    danger: 'border-destructive/20',
  }

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-card rounded-xl border ${variantStyles[variant]} p-5`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`h-9 w-9 rounded-lg ${iconStyles[variant]} flex items-center justify-center`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-foreground font-mono text-2xl font-bold tracking-tight">
        {value}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{label}</p>
    </motion.div>
  )
}
