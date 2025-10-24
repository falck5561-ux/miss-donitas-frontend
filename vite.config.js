import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        // --- CAMBIOS AQUÍ ---
        name: 'Miss Donitas', // <-- Nombre
        short_name: 'Donitas', // <-- Nombre corto
        description: 'Donas frescas, postres deliciosos y más.', // <-- Descripción
        theme_color: '#FF69B4', // <-- Color Rosa (o el que uses)
        icons: [
          {
            src: 'dona-icon.png', // <-- Icono de dona (192x192 o similar)
            sizes: '192x192',     // <-- Tamaño del icono
            type: 'image/png',
            purpose: 'any maskable' // <-- Añadido
          },
          {
            src: 'miss-donitas-logo.png', // <-- Logo de Miss Donitas (512x512)
            sizes: '512x512',           // <-- Tamaño del icono
            type: 'image/png',
            purpose: 'any maskable' // <-- Añadido
          }
        ]
        // --- FIN DE CAMBIOS ---
      }
    })
  ],
})