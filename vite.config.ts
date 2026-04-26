import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Libreo',
        short_name: 'Libreo',
        description: 'Aplicación contable personal y compartida con partida doble.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Nuevo asiento', url: '/journal/new', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Reportes', url: '/reports/ledger', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /\/functions\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate' as const,
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
