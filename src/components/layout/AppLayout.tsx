import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Home,
  User,
  BookOpen,
  ChevronDown,
  BookMarked,
  FileText,
  BarChart2,
  CreditCard,
  Scale,
  TrendingUp,
  Landmark,
  Coins,
} from 'lucide-react';
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
import { InstallPrompt } from '@/components/InstallPrompt';
import { UpdateToast } from '@/components/UpdateToast';
import { MobileSectionNav, type SectionNavItem } from '@/components/layout/MobileSectionNav';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/journal', label: 'Diario', icon: FileText, end: false },
  { to: '/accounts', label: 'Cuentas', icon: BookMarked, end: false },
  { to: '/reports/ledger', label: 'Reportes', icon: BarChart2, end: false },
  { to: '/profile', label: 'Perfil', icon: User, end: false },
];

const reportNavItems: SectionNavItem[] = [
  { to: '/reports/ledger', label: 'Mayor', icon: BookOpen },
  { to: '/reports/trial-balance', label: 'Bal. Comprobación', shortLabel: 'Comprobación', icon: Scale },
  { to: '/reports/income-statement', label: 'Estado de Resultados', shortLabel: 'Resultados', icon: TrendingUp },
  { to: '/reports/balance-sheet', label: 'Balance General', shortLabel: 'Balance', icon: Landmark },
];

const toolNavItems: SectionNavItem[] = [
  { to: '/currencies', label: 'Tasas de cambio', shortLabel: 'Tasas', icon: Coins },
  { to: '/loans', label: 'Préstamos', icon: CreditCard },
];

const sectionNavItems = [...reportNavItems, ...toolNavItems];

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
  );

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
  const { pathname } = useLocation();
  // Visible solo dentro de las secciones que la propia barra enlaza, para no dejar
  // esas rutas sin forma de volver a las demás.
  const showSectionNav = sectionNavItems.some(
    ({ to }) => pathname === to || pathname.startsWith(`${to}/`)
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r bg-background p-4 gap-1">
        <div className="mb-3">
          <p className="text-lg font-bold px-2 mb-2">Libreo</p>
          <BookSelector />
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={sidebarLinkClass}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        <div className="pt-1 pb-0.5">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reportes</p>
          {reportNavItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <NavLink to="/currencies" className={sidebarLinkClass}>
          Tasas de cambio
        </NavLink>
        <NavLink to="/loans" className={sidebarLinkClass}>
          <CreditCard className="h-4 w-4" />
          Préstamos
        </NavLink>
      </aside>

      {/* Header móvil (+ nav deslizable de secciones, solo en /reports) */}
      <div className="md:hidden sticky top-0 z-10 border-b bg-background">
        <header
          className="flex items-center justify-between px-3"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: '0.5rem' }}
        >
          <span className="font-bold text-sm">Libreo</span>
          <BookSelector />
        </header>
        {showSectionNav && <MobileSectionNav items={sectionNavItems} />}
      </div>

      {/* Main content */}
      {/* pb compensa la nav fija + safe-area-inset-bottom via CSS var definida en index.css */}
      <main className="flex-1 md:pb-0 overflow-auto" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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

      <InstallPrompt />
      <UpdateToast />
    </div>
  );
}
