import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { store } from './store'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { ErrorBoundary } from './lib/errorBoundary'

// Recover from stale PWA chunks after a new deploy: if a lazy chunk fails to
// load (old index.html referencing purged hashed files), reload once to fetch
// the fresh build instead of showing a white screen.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'vite-preload-reloaded'
  if (!sessionStorage.getItem(KEY)) {
    sessionStorage.setItem(KEY, '1')
    window.location.reload()
  }
})

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, activating and reloading...')
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App is ready for offline usage.')
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false
        return failureCount < 1
      },
      staleTime: 5 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary fallbackMessage="Something went wrong while loading the app. Please reload the page.">
            <App />
          </ErrorBoundary>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                iconTheme: { primary: '#14b8a6', secondary: '#f1f5f9' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
