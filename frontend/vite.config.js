import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_DEV_PORT || 5173)
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: true, // Enable service worker in dev mode
          type: 'module'
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 3000000,
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
          globIgnores: [
            '**/saudi-vision-2030-logo.png',
            '**/images/laundry/**',
          ],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkOnly', // Don't cache API routes using SW, let Redux/IDB handle offline data sync
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\/uploads\/.*\.(webp|png|jpg|jpeg|gif|svg)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'uploaded-images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|webp|gif|ttf)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Maqder ERP & POS',
          short_name: 'Maqder',
          description: 'Offline-First POS and ERP System',
          theme_color: '#ffffff',
          display: 'standalone',
          background_color: '#ffffff'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
            'query-vendor': ['@tanstack/react-query'],
            'ui-vendor': ['lucide-react'],
            'motion-vendor': ['framer-motion'],
            'toast-vendor': ['react-hot-toast'],
            'chart-vendor': ['recharts'],
            'axios-vendor': ['axios'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
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
