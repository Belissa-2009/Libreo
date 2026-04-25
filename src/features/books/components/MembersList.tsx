import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Member } from '../api';
import { removeMember, updateMemberRole } from '../api';
import type { Database } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

type MemberRole = Database['public']['Enums']['member_role'];

interface Props {
  bookId: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

export function MembersList({ bookId, members, currentUserId, isAdmin }: Props) {
  const qc = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    setLoadingId(userId);
    try {
      await updateMemberRole(bookId, userId, role);
      qc.invalidateQueries({ queryKey: ['members', bookId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar rol');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setLoadingId(userId);
    try {
      await removeMember(bookId, userId);
      qc.invalidateQueries({ queryKey: ['members', bookId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al quitar miembro');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const name = m.profiles?.full_name ?? m.user_id;
        const isSelf = m.user_id === currentUserId;
        return (
          <div key={m.user_id} className="flex items-center gap-2 py-1">
            <span className="flex-1 text-sm truncate">{name}</span>
            {isAdmin && !isSelf ? (
              <>
                <Select
                  value={m.role}
                  onValueChange={(v) => handleRoleChange(m.user_id, v as MemberRole)}
                  disabled={loadingId === m.user_id}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Solo lectura</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemove(m.user_id)}
                  disabled={loadingId === m.user_id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
