import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
    plugins: [react()],
    define: {
        'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
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
});
