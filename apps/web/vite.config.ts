import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
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
      }
    }
  },
  preview: {
    host: true,
    allowedHosts: ["finixarg.com"]
  }
})
