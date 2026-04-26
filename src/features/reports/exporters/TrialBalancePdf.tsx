import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { ReportLayout } from '@/lib/exporters/pdf'
import type { TrialBalanceRow } from '../api'

const s = StyleSheet.create({
  table: { width: '100%' },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 3 },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #999', paddingVertical: 3, backgroundColor: '#f5f5f5' },
  bold: { fontFamily: 'Helvetica-Bold' },
  code: { width: '14%' },
  name: { flex: 1 },
  num: { width: '18%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', borderTop: '2px solid #999', paddingVertical: 3, marginTop: 2 },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface Props {
  bookName: string
  toDate: string
  rows: TrialBalanceRow[]
}

export function TrialBalancePdf({ bookName, toDate, rows }: Props) {
  const totalDebit = rows.reduce((s, r) => s + r.total_debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.total_credit, 0)

  return (
    <ReportLayout bookName={bookName} title="Balance de Comprobación" subtitle={`Al ${toDate}`}>
      <View style={s.table}>
        <View style={s.headerRow}>
          <Text style={[s.code, s.bold]}>Código</Text>
          <Text style={[s.name, s.bold]}>Cuenta</Text>
          <Text style={[s.num, s.bold]}>Debe</Text>
          <Text style={[s.num, s.bold]}>Haber</Text>
          <Text style={[s.num, s.bold]}>Saldo</Text>
        </View>
        {rows.map((r) => (
          <View key={r.account_id} style={s.row}>
            <Text style={s.code}>{r.code}</Text>
            <Text style={s.name}>{r.name}</Text>
            <Text style={s.num}>{fmt(r.total_debit)}</Text>
            <Text style={s.num}>{fmt(r.total_credit)}</Text>
            <Text style={s.num}>{fmt(r.balance)}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={[s.code, s.bold]} />
          <Text style={[s.name, s.bold]}>Total</Text>
          <Text style={[s.num, s.bold]}>{fmt(totalDebit)}</Text>
          <Text style={[s.num, s.bold]}>{fmt(totalCredit)}</Text>
          <Text style={[s.num, s.bold]} />
        </View>
      </View>
    </ReportLayout>
  )
}
