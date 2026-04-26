import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/features/profile/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const schema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
});
type ProfileForm = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const { defaultCurrencyCode, savePreferences, isSaving, isLoading: prefsLoading } =
    useUserPreferences();
  const [selectedCurrency, setSelectedCurrency] = useState('DOP');
  const [currencies, setCurrencies] = useState<{ code: string; name: string }[]>([]);

  // Sync selected currency once preferences load
  useEffect(() => {
    setSelectedCurrency(defaultCurrencyCode);
  }, [defaultCurrencyCode]);

  useEffect(() => {
    supabase
      .from('currencies')
      .select('code, name')
      .order('code')
      .then(({ data }) => { if (data) setCurrencies(data); });
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user?.user_metadata?.full_name ?? '' },
  });

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName })
        .eq('id', user!.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: data.fullName } });
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await savePreferences({ default_currency_code: selectedCurrency });
      toast.success('Preferencias guardadas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar preferencias');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar sesión');
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 space-y-4">
      {/* Segmento: Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Correo electrónico</Label>
            <Input value={user?.email ?? ''} readOnly className="bg-muted" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
          <Separator />
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      {/* Segmento: Configuración del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="defaultCurrency">Divisa por defecto</Label>
            <p className="text-xs text-muted-foreground">
              Se pre-seleccionará en todos los formularios del sistema.
            </p>
            <select
              id="defaultCurrency"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              disabled={prefsLoading}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleSavePreferences} disabled={isSaving || prefsLoading}>
            {isSaving ? 'Guardando...' : 'Guardar preferencias'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
