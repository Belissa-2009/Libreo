import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  filenameBase: string
  pdf?: () => Promise<void>
  xlsx?: () => void
  csv?: () => void
}

export function ExportButton({ pdf, xlsx, csv }: ExportButtonProps) {
  const [loadingPdf, setLoadingPdf] = useState(false)

  async function handlePdf() {
    if (!pdf) return
    setLoadingPdf(true)
    try {
      await pdf()
    } catch (e) {
      toast.error('Error generando PDF')
      console.error(e)
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loadingPdf}>
          {loadingPdf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {pdf && (
          <DropdownMenuItem onClick={handlePdf}>PDF</DropdownMenuItem>
        )}
        {xlsx && (
          <DropdownMenuItem onClick={() => { try { xlsx() } catch (e) { toast.error('Error generando Excel'); console.error(e) } }}>
            Excel
          </DropdownMenuItem>
        )}
        {csv && (
          <DropdownMenuItem onClick={() => { try { csv() } catch (e) { toast.error('Error generando CSV'); console.error(e) } }}>
            CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
