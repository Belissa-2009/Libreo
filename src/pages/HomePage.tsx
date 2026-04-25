import { useAuth } from '@/features/auth/AuthProvider';

export default function HomePage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name ?? user?.email ?? '';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Hola, {name}</h1>
      <p className="text-muted-foreground mt-1">Selecciona o crea un libro contable para comenzar.</p>
    </div>
  );
}
