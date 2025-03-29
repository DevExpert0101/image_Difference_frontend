import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import dns from 'node:dns'
import react from "@vitejs/plugin-react"

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 8080,
  }
})