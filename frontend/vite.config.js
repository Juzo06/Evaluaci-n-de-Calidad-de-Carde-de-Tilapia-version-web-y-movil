import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El frontend corre en http://localhost:5173 y el backend (Spring Boot) en :8080.
// El proxy reenvía todo lo que empiece por /api al backend, así el navegador
// cree que es el mismo origen y no hace falta configurar CORS.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
