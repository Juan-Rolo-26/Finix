import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/admin': {
                target: 'http://localhost:5147',
                changeOrigin: true,
            },
            '/tv': {
                target: 'https://symbol-search.tradingview.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/tv/, ''),
            },
            '/tvscan': {
                target: 'https://scanner.tradingview.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/tvscan/, ''),
            },
        }
    }
})
