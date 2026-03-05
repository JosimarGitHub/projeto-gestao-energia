import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Permite conexões externas ao container
    port: 5173,      // Porta padrão
    watch: {
      usePolling: true, // Garante que o Hot Reload funcione na VM
    },
  },
})
