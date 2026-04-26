function fmt(amount: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

interface Row {
  code: string
  name: string
  amount: number
}

interface AccountTypeSectionProps {
  title: string
  rows: Row[]
  subtotalLabel?: string
}

export function AccountTypeSection({
  title,
  rows,
  subtotalLabel = 'Subtotal',
}: AccountTypeSectionProps) {
  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="mb-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-1 px-2">
        {title}
      </h3>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(row => (
              <tr key={row.code} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground w-20">{row.code}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(row.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground text-sm">
                  Sin movimientos
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-medium">
              <td colSpan={2} className="px-3 py-2">{subtotalLabel}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
