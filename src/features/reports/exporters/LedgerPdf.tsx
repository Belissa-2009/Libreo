import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { ReportLayout } from '@/lib/exporters/pdf'
import type { LedgerRow } from '../api'

const s = StyleSheet.create({
  table: { width: '100%' },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 2 },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #999', paddingVertical: 3, backgroundColor: '#f5f5f5' },
  bold: { fontFamily: 'Helvetica-Bold' },
  date: { width: '12%' },
  desc: { flex: 1 },
  ref: { width: '14%' },
  num: { width: '14%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', borderTop: '2px solid #999', paddingVertical: 3, marginTop: 2 },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface Props {
  bookName: string
  accountName: string
  fromDate: string
  toDate: string
  rows: LedgerRow[]
}

export function LedgerPdf({ bookName, accountName, fromDate, toDate, rows }: Props) {
  const finalBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0

  return (
    <ReportLayout
      bookName={bookName}
      title={`Mayor — ${accountName}`}
      subtitle={`Del ${fromDate} al ${toDate}`}
    >
      <View style={s.table}>
        <View style={s.headerRow}>
          <Text style={[s.date, s.bold]}>Fecha</Text>
          <Text style={[s.desc, s.bold]}>Descripción</Text>
          <Text style={[s.ref, s.bold]}>Referencia</Text>
          <Text style={[s.num, s.bold]}>Debe</Text>
          <Text style={[s.num, s.bold]}>Haber</Text>
          <Text style={[s.num, s.bold]}>Saldo</Text>
        </View>
        {rows.map((r) => (
          <View key={r.line_id} style={s.row}>
            <Text style={s.date}>{r.entry_date}</Text>
            <Text style={s.desc}>{r.description}</Text>
            <Text style={s.ref}>{r.reference ?? '—'}</Text>
            <Text style={s.num}>{r.debit ? fmt(r.debit) : ''}</Text>
            <Text style={s.num}>{r.credit ? fmt(r.credit) : ''}</Text>
            <Text style={s.num}>{fmt(r.balance)}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={[s.desc, s.bold]}>Saldo final</Text>
          <Text style={[s.num, s.bold]}>{fmt(finalBalance)}</Text>
        </View>
      </View>
    </ReportLayout>
  )
}
