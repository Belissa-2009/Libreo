import { NavLink, Outlet, useNavigate } from 'react-router';
import { Home, User, BookOpen, ChevronDown, BookMarked, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useActiveBook } from '@/features/books/useActiveBook';
import { listBooks } from '@/features/books/api';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/journal', label: 'Diario', icon: FileText, end: false },
  { to: '/accounts', label: 'Cuentas', icon: BookMarked, end: false },
  { to: '/profile', label: 'Perfil', icon: User, end: false },
];

function BookSelector() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBookId, setActiveBook } = useActiveBook();
  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });

  const activeBook = books?.find((b) => b.id === activeBookId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-[160px] justify-start gap-1 px-2">
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs">
            {activeBook ? activeBook.name : 'Sin libro'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {(books ?? []).map((book) => (
          <DropdownMenuItem
            key={book.id}
            onClick={() => { setActiveBook(book.id); navigate('/'); }}
            className={cn(book.id === activeBookId && 'font-medium')}
          >
            {book.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {activeBookId && (
          <DropdownMenuItem onClick={() => navigate(`/books/${activeBookId}/settings`)}>
            Configurar libro
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/books')}>
          Cambiar libro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/books/new')}>
          Nuevo libro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r bg-background p-4 gap-1">
        <div className="mb-3">
          <p className="text-lg font-bold px-2 mb-2">Libro Diario</p>
          <BookSelector />
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between border-b px-3 py-2 bg-background sticky top-0 z-10">
        <span className="font-bold text-sm">Libro Diario</span>
        <BookSelector />
      </header>

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background flex">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center py-2 text-xs gap-1 transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

