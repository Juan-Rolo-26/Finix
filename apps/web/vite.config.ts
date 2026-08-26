import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://apxfsuxftnovgkvdrwpx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_1R8SGghwzgAzT7HjOeGMZw_fINqXZZs')
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      external: []
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3010",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:3010",
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    allowedHosts: ["finixarg.com"]
  }
})
