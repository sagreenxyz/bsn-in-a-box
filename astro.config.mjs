import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import VitePWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://sagreenxyz.github.io',
  base: '/bsn-in-a-box',
  output: 'static',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sagreenxyz\.github\.io\/bsn-in-a-box\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
      manifest: {
        name: 'BSN in a Box',
        short_name: 'BSN Box',
        description:
          'A complete, self-directed, competency-gated Bachelor of Science in Nursing learning system — free, offline-capable, and student-owned.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/bsn-in-a-box/',
        start_url: '/bsn-in-a-box/',
        icons: [
          {
            src: '/bsn-in-a-box/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/bsn-in-a-box/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/bsn-in-a-box/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['chart.js'],
    },
  },
});
