import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/utils';

export type SectionNavItem = {
  to: string;
  label: string;
  /** Etiqueta corta usada en móvil; cae al label completo si no se define. */
  shortLabel?: string;
  icon: ComponentType<{ className?: string }>;
};

/**
 * Barra horizontal deslizable con las secciones que en desktop viven en el sidebar
 * (reportes, tasas de cambio, préstamos) y que en móvil no caben en la nav inferior.
 */
export function MobileSectionNav({ items }: { items: SectionNavItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const { pathname } = useLocation();

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  // Centra la sección activa al cambiar de ruta (p. ej. al llegar desde la nav inferior).
  useEffect(() => {
    const active = scrollerRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="relative md:hidden">
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="no-scrollbar flex gap-1.5 overflow-x-auto overscroll-x-contain px-3 py-1"
        style={{
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        }}
      >
        <nav aria-label="Secciones" className="flex gap-1.5">
          {items.map(({ to, label, shortLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-border bg-background text-muted-foreground active:bg-accent'
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {shortLabel ?? label}
            </NavLink>
          ))}
        </nav>
      </div>

      {edges.start && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-background to-transparent" />
      )}
      {edges.end && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-background to-transparent" />
      )}
    </div>
  );
}
