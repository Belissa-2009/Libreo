import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { ReportLayout } from '@/lib/exporters/pdf'
import type { IncomeStatementRow } from '../api'

const s = StyleSheet.create({
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 3 },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #999', paddingVertical: 3, backgroundColor: '#f5f5f5' },
  bold: { fontFamily: 'Helvetica-Bold' },
  code: { width: '14%' },
  name: { flex: 1 },
  num: { width: '22%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', borderTop: '2px solid #999', paddingVertical: 3, marginTop: 2 },
  netRow: { flexDirection: 'row', borderTop: '2px solid #333', paddingVertical: 4, marginTop: 8, backgroundColor: '#f5f5f5' },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface Props {
  bookName: string
  fromDate: string
  toDate: string
  rows: IncomeStatementRow[]
}

export function IncomeStatementPdf({ bookName, fromDate, toDate, rows }: Props) {
  const income = rows.filter((r) => r.type === 'income')
  const expenses = rows.filter((r) => r.type === 'expense')
  const totalIncome = income.reduce((s, r) => s + r.amount, 0)
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0)
  const net = totalIncome - totalExpense

  const renderSection = (title: string, items: IncomeStatementRow[], total: number) => (
    <>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.headerRow}>
        <Text style={[s.code, s.bold]}>Código</Text>
        <Text style={[s.name, s.bold]}>Cuenta</Text>
        <Text style={[s.num, s.bold]}>Monto</Text>
      </View>
      {items.map((r) => (
        <View key={r.account_id} style={s.row}>
          <Text style={s.code}>{r.code}</Text>
          <Text style={s.name}>{r.name}</Text>
          <Text style={s.num}>{fmt(r.amount)}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.name, s.bold]}>Total {title}</Text>
        <Text style={[s.num, s.bold]}>{fmt(total)}</Text>
      </View>
    </>
  )

  return (
    <ReportLayout
      bookName={bookName}
      title="Estado de Resultados"
      subtitle={`Del ${fromDate} al ${toDate}`}
    >
      <View>
        {renderSection('Ingresos', income, totalIncome)}
        {renderSection('Gastos', expenses, totalExpense)}
        <View style={s.netRow}>
          <Text style={[s.name, s.bold]}>Resultado Neto</Text>
          <Text style={[s.num, s.bold]}>{fmt(net)}</Text>
        </View>
      </View>
    </ReportLayout>
  )
}
