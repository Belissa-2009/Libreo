import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { acceptInvitation } from '@/features/books/api';
import { useActiveBook } from '@/features/books/useActiveBook';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setActiveBook } = useActiveBook();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const token = params.get('token');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMsg('Token de invitación no encontrado.');
      return;
    }

    if (status !== 'idle') return;

    setStatus('loading');
    acceptInvitation(token)
      .then(({ book_id }) => {
        setActiveBook(book_id);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'Error al aceptar invitación');
        setStatus('error');
      });
  }, [loading, user, token, status, navigate, setActiveBook]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invitación</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-green-600 dark:text-green-400">¡Te uniste al libro con éxito!</p>
              <p className="text-xs text-muted-foreground">Redirigiendo...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{errorMsg}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Ir al inicio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
