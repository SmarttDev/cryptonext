import type { Severity } from '@cryptonext/shared'

const styles: Record<Severity, string> = {
  info: 'bg-primary/10 text-primary border-primary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
}

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[severity]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          severity === 'info'
            ? 'bg-primary'
            : severity === 'warning'
              ? 'bg-warning'
              : 'bg-destructive'
        }`}
      />
      <span className="capitalize">{severity}</span>
    </span>
  )
}
