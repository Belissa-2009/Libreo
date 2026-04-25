import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createBook } from '@/features/books/api';
import { useActiveBook } from '@/features/books/useActiveBook';
import { createBookSchema, type CreateBookForm } from '@/features/books/schemas';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewBookPage() {
  const navigate = useNavigate();
  const { setActiveBook } = useActiveBook();

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('code, name')
        .order('code');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<CreateBookForm>({
      resolver: zodResolver(createBookSchema),
      defaultValues: { base_currency: 'USD' },
    });

  const onSubmit = async (data: CreateBookForm) => {
    try {
      const bookId = await createBook(data.name, data.base_currency);
      setActiveBook(bookId);
      toast.success(`Libro "${data.name}" creado`);
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear libro');
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo libro contable</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="book-name">Nombre del libro</Label>
              <Input id="book-name" placeholder="Ej: Personal 2025" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Moneda base</Label>
              <Controller
                control={control}
                name="base_currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currencies ?? []).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.base_currency && (
                <p className="text-xs text-destructive">{errors.base_currency.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creando...' : 'Crear libro'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
