import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { ReportLayout } from '@/lib/exporters/pdf'
import type { BalanceSheetRow } from '../api'

const s = StyleSheet.create({
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 3 },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #999', paddingVertical: 3, backgroundColor: '#f5f5f5' },
  bold: { fontFamily: 'Helvetica-Bold' },
  code: { width: '14%' },
  name: { flex: 1 },
  num: { width: '22%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', borderTop: '2px solid #999', paddingVertical: 3, marginTop: 2 },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface Props {
  bookName: string
  toDate: string
  rows: BalanceSheetRow[]
}

export function BalanceSheetPdf({ bookName, toDate, rows }: Props) {
  const assets = rows.filter((r) => r.type === 'asset')
  const liabilities = rows.filter((r) => r.type === 'liability')
  const equity = rows.filter((r) => r.type === 'equity')

  const totalAssets = assets.reduce((s, r) => s + r.balance, 0)
  const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0)
  const totalEquity = equity.reduce((s, r) => s + r.balance, 0)

  const renderSection = (title: string, items: BalanceSheetRow[], total: number) => (
    <>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.headerRow}>
        <Text style={[s.code, s.bold]}>Código</Text>
        <Text style={[s.name, s.bold]}>Cuenta</Text>
        <Text style={[s.num, s.bold]}>Saldo</Text>
      </View>
      {items.map((r) => (
        <View key={r.account_id} style={s.row}>
          <Text style={s.code}>{r.code}</Text>
          <Text style={s.name}>{r.name}</Text>
          <Text style={s.num}>{fmt(r.balance)}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.name, s.bold]}>Total {title}</Text>
        <Text style={[s.num, s.bold]}>{fmt(total)}</Text>
      </View>
    </>
  )

  return (
    <ReportLayout bookName={bookName} title="Balance General" subtitle={`Al ${toDate}`}>
      <View>
        {renderSection('Activos', assets, totalAssets)}
        {renderSection('Pasivos', liabilities, totalLiabilities)}
        {renderSection('Patrimonio', equity, totalEquity)}
        <View style={{ flexDirection: 'row', borderTop: '2px solid #333', paddingVertical: 4, marginTop: 8, backgroundColor: '#f5f5f5' }}>
          <Text style={[s.name, s.bold]}>Total Pasivo + Patrimonio</Text>
          <Text style={[s.num, s.bold]}>{fmt(totalLiabilities + totalEquity)}</Text>
        </View>
      </View>
    </ReportLayout>
  )
}
