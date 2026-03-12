import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const normalizeBasePath = (value?: string) => {
  if (!value) {
    return '/'
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const base = normalizeBasePath(env.VITE_ADMIN_BASE_PATH)
  const proxyTarget = env.VITE_ADMIN_API_PROXY_TARGET || 'http://localhost:3010'
  const devPort = Number(env.VITE_ADMIN_DEV_PORT || 5147)
  const previewPort = Number(env.VITE_ADMIN_PREVIEW_PORT || 4174)

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: devPort,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: previewPort,
      strictPort: true,
      host: true,
    },
  }
})
