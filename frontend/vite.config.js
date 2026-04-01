import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_DEV_PORT || 5173)
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number.isFinite(devPort) && devPort > 0 ? devPort : 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
