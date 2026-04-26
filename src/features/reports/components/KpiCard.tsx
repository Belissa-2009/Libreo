interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  highlight?: 'positive' | 'negative' | 'neutral'
}

export function KpiCard({ title, value, subtitle, highlight = 'neutral' }: KpiCardProps) {
  const valueClass =
    highlight === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : highlight === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : ''

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
