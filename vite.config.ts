import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        id: '/',
        scope: '/',
        name: 'Dranklijst',
        short_name: 'Dranklijst',
        description: 'Digitale streepjeslijst voor Chiro',
        theme_color: '#2563EB',
        background_color: '#F8FAFC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/appstore-images/android/launchericon-48x48.png',   sizes: '48x48',   type: 'image/png' },
          { src: '/appstore-images/android/launchericon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/appstore-images/android/launchericon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/appstore-images/android/launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/appstore-images/android/launchericon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/appstore-images/android/launchericon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/appstore-images/android/launchericon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/appstore-images/android/launchericon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
