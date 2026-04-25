import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { listBooks } from '@/features/books/api';
import { useActiveBook } from '@/features/books/useActiveBook';
import { BookCard } from '@/features/books/components/BookCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';

export default function BooksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveBook } = useActiveBook();

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });

  // Auto-redirect if only one book
  useEffect(() => {
    if (!books) return;
    if (books.length === 0) {
      navigate('/books/new', { replace: true });
    } else if (books.length === 1) {
      setActiveBook(books[0].id);
      navigate('/', { replace: true });
    }
  }, [books, navigate, setActiveBook]);

  const handleEnter = (id: string) => {
    setActiveBook(id);
    navigate('/');
  };

  const handleSettings = (id: string) => {
    navigate(`/books/${id}/settings`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    toast.error('Error al cargar libros');
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Mis libros</h1>
        <Button size="sm" onClick={() => navigate('/books/new')}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo libro
        </Button>
      </div>
      <div className="space-y-3">
        {(books ?? []).map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onEnter={handleEnter}
            onSettings={handleSettings}
          />
        ))}
      </div>
    </div>
  );
}
