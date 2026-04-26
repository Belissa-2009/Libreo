import { useState } from 'react';
import type { EntryWithLines } from '../api';
import { calcTotals } from '../api';
import type { Account } from '@/features/accounts/api';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  entry: EntryWithLines;
  accountsMap: Record<string, Account>;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function EntryCard({ entry, accountsMap, canEdit, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { totalDebit } = calcTotals(entry.journal_lines);

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-accent/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">{entry.entry_date}</span>
            <span className="text-sm font-medium truncate">{entry.description}</span>
          </div>
          {entry.reference && (
            <span className="text-xs text-muted-foreground">{entry.reference}</span>
          )}
        </div>
        <span className="text-sm font-mono shrink-0">
          {entry.currency_code} {totalDebit.toFixed(2)}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
      {expanded && (
        <div className="border-t px-3 py-2 space-y-2">
          <div className="space-y-1">
            {entry.journal_lines
              .sort((a, b) => a.position - b.position)
              .map((line) => {
                const acc = accountsMap[line.account_id];
                return (
                  <div key={line.id} className="flex items-start gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                      {acc ? `${acc.code} · ${acc.name}` : line.account_id}
                    </span>
                    {line.memo && <span className="text-xs text-muted-foreground flex-1 truncate">{line.memo}</span>}
                    <span className={cn('text-xs font-mono ml-auto shrink-0', line.debit > 0 ? '' : 'text-muted-foreground')}>
                      {line.debit > 0 ? `D ${line.debit.toFixed(2)}` : `C ${line.credit.toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
          </div>
          {canEdit && (
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Borrar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
