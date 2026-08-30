import { useEffect, type ReactNode } from 'react';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';

/** Debe coincidir con --background de :root y .dark en index.css. */
const THEME_COLORS = { light: '#ffffff', dark: '#0a0a0a' } as const;

/**
 * Mantiene <meta name="theme-color"> alineado con el tema activo para que la
 * barra del navegador y la PWA instalada no queden de un color que no existe.
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[resolvedTheme]);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorSync />
      {children}
    </NextThemeProvider>
  );
}
