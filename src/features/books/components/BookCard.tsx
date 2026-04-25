import type { BookWithRole } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Solo lectura',
};

interface Props {
  book: BookWithRole;
  onEnter: (id: string) => void;
  onSettings?: (id: string) => void;
}

export function BookCard({ book, onEnter, onSettings }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{book.name}</CardTitle>
          <Badge variant="secondary" className="text-xs shrink-0">
            {roleLabels[book.role] ?? book.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">Moneda base: {book.base_currency}</p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onEnter(book.id)}>
            Entrar
          </Button>
          {book.role === 'admin' && onSettings && (
            <Button size="sm" variant="outline" onClick={() => onSettings(book.id)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
