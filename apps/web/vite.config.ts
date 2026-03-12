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
    },
    build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@supabase')) {
                            return 'vendor-supabase';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    },
    esbuild: {
        drop: ['console', 'debugger'],
    }
})
