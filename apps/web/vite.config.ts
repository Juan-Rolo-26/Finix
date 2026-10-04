import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT') || supabaseAnonKey.includes('REPLACE_WITH')) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY válidas en apps/web/.env. ' +
      'El build se detuvo para evitar publicar una página en blanco.',
    )
  }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
    },
    resolve: {
      alias: {
        "@finix/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
        "@": path.resolve(__dirname, "src")
      }
    },
    build: {
      rollupOptions: {
        external: [],
        output: {
          // Group small shared modules without pulling closed dialogs/charts into
          // the initial route. Explicit assignments keep dependency boundaries.
          onlyExplicitManualChunks: true,
          manualChunks(id) {
            // React and Rollup's CJS interop stay independent of the app entry,
            // avoiding an initialization cycle with the icon/motion chunks.
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id) || id.includes('commonjsHelpers')) return 'react-vendor';
            if (id.includes('/node_modules/lucide-react/')) return 'icons';
            if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          },
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      allowedHosts: true,
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
      allowedHosts: true
    }
  }
})
