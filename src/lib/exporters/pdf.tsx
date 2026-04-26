import { Document, Page, Text, View, StyleSheet, pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

const baseStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 16,
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 8,
  },
  bookName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: '1px solid #e0e0e0',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888',
  },
  content: {
    flex: 1,
  },
})

interface ReportLayoutProps {
  bookName: string
  title: string
  subtitle: string
  children: ReactElement | ReactElement[]
}

export function ReportLayout({ bookName, title, subtitle, children }: ReportLayoutProps) {
  const generated = new Date().toLocaleString('es', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        <View style={baseStyles.header}>
          <Text style={baseStyles.bookName}>{bookName}</Text>
          <Text style={baseStyles.title}>{title}</Text>
          <Text style={baseStyles.subtitle}>{subtitle}</Text>
        </View>

        <View style={baseStyles.content}>{children}</View>

        <View style={baseStyles.footer} fixed>
          <Text>Generado el {generated}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downloadPdf(filename: string, document: ReactElement<any>): Promise<void> {
  const blob = await pdf(document as ReactElement<DocumentProps>).toBlob()
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
