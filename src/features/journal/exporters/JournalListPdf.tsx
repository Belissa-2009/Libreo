import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { ReportLayout } from '@/lib/exporters/pdf'
import type { EntryWithLines } from '@/features/journal/api'

export type JournalEntryWithLines = EntryWithLines

const s = StyleSheet.create({
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 2 },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '2px solid #999',
    paddingVertical: 3,
    backgroundColor: '#f5f5f5',
  },
  bold: { fontFamily: 'Helvetica-Bold' },
  date: { width: '12%' },
  desc: { flex: 1 },
  ref: { width: '14%' },
  num: { width: '14%', textAlign: 'right' },
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface Props {
  bookName: string
  fromDate: string
  toDate: string
  entries: EntryWithLines[]
}

export function JournalListPdf({ bookName, fromDate, toDate, entries }: Props) {
  return (
    <ReportLayout
      bookName={bookName}
      title="Listado de Asientos"
      subtitle={`Del ${fromDate} al ${toDate}`}
    >
      <View>
        <View style={s.headerRow}>
          <Text style={[s.date, s.bold]}>Fecha</Text>
          <Text style={[s.desc, s.bold]}>Descripción</Text>
          <Text style={[s.ref, s.bold]}>Referencia</Text>
          <Text style={[s.num, s.bold]}>Total Debe</Text>
        </View>
        {entries.map((e) => (
          <View key={e.id} style={s.row}>
            <Text style={s.date}>{e.entry_date}</Text>
            <Text style={s.desc}>{e.description ?? '—'}</Text>
            <Text style={s.ref}>{e.reference ?? '—'}</Text>
            <Text style={s.num}>{fmt(e.journal_lines.reduce((s, l) => s + Number(l.debit ?? 0), 0))}</Text>
          </View>
        ))}
      </View>
    </ReportLayout>
  )
}
