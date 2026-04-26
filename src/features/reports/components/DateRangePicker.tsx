import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface DateRangePickerProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  single?: boolean
}

export function DateRangePicker({ from, to, onChange, single }: DateRangePickerProps) {
  const [localFrom, setLocalFrom] = useState(from)
  const [localTo, setLocalTo] = useState(to)

  function apply() {
    onChange(localFrom, localTo)
  }

  if (single) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-to">Al cierre</Label>
          <Input
            id="date-to"
            type="date"
            value={localTo}
            onChange={e => setLocalTo(e.target.value)}
            className="w-44"
          />
        </div>
        <Button variant="secondary" onClick={() => onChange(localFrom, localTo)}>
          Aplicar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="date-from">Desde</Label>
        <Input
          id="date-from"
          type="date"
          value={localFrom}
          onChange={e => setLocalFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="date-to">Hasta</Label>
        <Input
          id="date-to"
          type="date"
          value={localTo}
          onChange={e => setLocalTo(e.target.value)}
          className="w-40"
        />
      </div>
      <Button variant="secondary" onClick={apply}>
        Aplicar
      </Button>
    </div>
  )
}
