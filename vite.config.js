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
        name: 'Tito Café',
        short_name: 'TitoCafé',
        description: 'La aplicación oficial de Tito Café.',
        theme_color: '#ffffff', // Puedes cambiar este color
        icons: [
          {
            src: 'tito-icon.png', // <-- Tu archivo de la carpeta public
            sizes: '160x160',     // <-- Revisa que este sea el tamaño real
            type: 'image/png'
          },
          {
            src: 'logo-inicio.png', // <-- Tu otro archivo de la carpeta public
            sizes: '512x512',       // <-- Revisa que este sea el tamaño real
            type: 'image/png'
          }
        ]
      }
    })
  ],
})