import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AccountNode } from '../hooks/useAccounts';
import { Edit2, Trash2, PowerOff } from 'lucide-react';

const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-700',
  liability: 'bg-red-100 text-red-700',
  equity: 'bg-purple-100 text-purple-700',
  income: 'bg-green-100 text-green-700',
  expense: 'bg-orange-100 text-orange-700',
};

const typeLabels: Record<string, string> = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Patrimonio',
  income: 'Ingreso',
  expense: 'Gasto',
};

interface Props {
  nodes: AccountNode[];
  depth?: number;
  canEdit: boolean;
  onEdit: (node: AccountNode) => void;
  onToggle: (node: AccountNode) => void;
  onDelete: (node: AccountNode) => void;
}

export function AccountTree({
  nodes,
  depth = 0,
  canEdit,
  onEdit,
  onToggle,
  onDelete,
}: Props) {
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className={cn(
              'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/40 group',
              !node.is_active && 'opacity-50'
            )}
            style={{ paddingLeft: `${8 + depth * 20}px` }}
          >
            <span className="text-sm font-mono text-muted-foreground w-16 shrink-0 truncate">
              {node.code}
            </span>
            <span className={cn('text-sm flex-1', !node.is_active && 'line-through')}>
              {node.name}
            </span>
            {depth === 0 && (
              <Badge
                className={cn('text-xs shrink-0 hidden sm:flex', typeColors[node.type])}
                variant="outline"
              >
                {typeLabels[node.type]}
              </Badge>
            )}
            {!node.is_active && (
              <Badge variant="outline" className="text-xs shrink-0">
                Inactiva
              </Badge>
            )}
            {canEdit && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(node)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => onToggle(node)}
                  title={node.is_active ? 'Desactivar' : 'Activar'}
                >
                  <PowerOff className="h-3 w-3" />
                </Button>
                {node.children.length === 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => onDelete(node)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {node.children.length > 0 && (
            <AccountTree
              nodes={node.children}
              depth={depth + 1}
              canEdit={canEdit}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </div>
  );
}
