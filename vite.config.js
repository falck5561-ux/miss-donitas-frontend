import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite-pwa-org.netlify.app/guide/
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Miss Donitas',
        short_name: 'Donitas',
        description: 'Donas frescas, postres deliciosos y más.',
        theme_color: '#FF69B4',
        icons: [
          {
            src: '/dona-icon.png', // Ruta corregida
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/miss-donitas-logo.png', // Ruta corregida
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})