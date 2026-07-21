import axios from 'axios'
import { enqueueSyncItem, initDb } from './syncEngine'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

const getApiErrorMessage = (error) => {
  const responseMessage = error.response?.data?.error

  if (responseMessage) {
    return responseMessage
  }

  if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
    return 'The service is temporarily unavailable. Please try again in a moment.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.'
  }

  if (!error.response) {
    return 'Unable to reach the server. Please check the deployment or proxy configuration.'
  }

  return error.message || 'Request failed'
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  async (response) => {
    const { config } = response;
    // Cache successful GET responses in IndexedDB
    if (config && config.method === 'get' && !config.url.includes('/auth/')) {
      try {
        const db = await initDb();
        const cacheKey = config.url + (config.params ? JSON.stringify(config.params) : '');
        await db.put('api_cache', {
          url: cacheKey,
          data: response.data,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Failed to cache successful GET response:', err);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const isNetworkError = !error.response || !navigator.onLine;
    
    if (isNetworkError && config) {
      // 1. If it's a GET request, attempt to retrieve the cached response
      if (config.method === 'get') {
        try {
          const db = await initDb();
          const cacheKey = config.url + (config.params ? JSON.stringify(config.params) : '');
          const cached = await db.get('api_cache', cacheKey);
          if (cached) {
            console.log(`[Offline-Cache] Serving cached data for ${cacheKey}`);
            return Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config
            });
          }
        } catch (e) {
          console.error('Failed to read GET request cache:', e);
        }
      }

      // 2. If it's a mutation request, queue it for background syncing
      const isMutation = ['post', 'put', 'delete'].includes(config.method);
      const requestUrl = String(config.url || '');
      const isAuthRequest = requestUrl.includes('/auth/login') ||
                            requestUrl.includes('/auth/me') ||
                            requestUrl.includes('/public/demo-login') ||
                            requestUrl.includes('/auth/register');

      if (isMutation && !isAuthRequest) {
        try {
          const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          const syncId = await enqueueSyncItem(`${config.method.toUpperCase()}:${config.url}`, {
            url: config.url,
            method: config.method,
            data: payload,
            headers: config.headers
          });

          console.log(`[Offline-Queue] Queued mutation: ${config.method.toUpperCase()} ${config.url}`);
          return Promise.resolve({
            data: { success: true, offline: true, id: syncId, message: 'Saved offline and queued for sync.' },
            status: 202,
            statusText: 'Accepted Offline',
            headers: {},
            config
          });
        } catch (e) {
          console.error('Failed to queue offline mutation:', e);
        }
      }
    }

    error.userMessage = getApiErrorMessage(error)

    // Trial limit reached — dispatch event for TrialLimitModal
    if (error.response?.status === 403 && error.response?.data?.error === 'TRIAL_LIMIT_REACHED') {
      window.dispatchEvent(new CustomEvent('trial-limit-reached', {
        detail: error.response.data,
      }))
    }

    const requestUrl = String(error.config?.url || '')
    // Requests that handle their own 401 logic — don't intercept these.
    // /auth/me    → getMe.rejected in authSlice clears state + token already.
    //               Firing auth-expired here too causes a double-cleanup race
    //               that leaves the login page stuck on the loading spinner.
    // /auth/login, /public/demo-login, /auth/register → entry-point calls
    //               where 401 is the expected "bad credentials" response.
    const isAuthManagedRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/me')
      || requestUrl.includes('/public/demo-login')
      || requestUrl.includes('/auth/register')

    if (error.response?.status === 401 && !isAuthManagedRequest) {
      const errMsg = error.response?.data?.error || ''
      if (errMsg === 'Tenant account is inactive') {
        window.dispatchEvent(new CustomEvent('tenant-inactive'))
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_tenant')
        // Use a CustomEvent so the React app can handle the redirect via
        // React Router instead of a hard page reload (which causes white screen).
        window.dispatchEvent(new CustomEvent('auth-expired'))
      }
    }

    return Promise.reject(error)
  }
)

export default api
