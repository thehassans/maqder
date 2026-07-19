import axios from 'axios'
import { enqueueSyncItem } from './syncEngine'

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
  (response) => response,
  async (error) => {
    // Offline-First Interceptor Logic
    const isNetworkError = !error.response || !navigator.onLine
    
    if (isNetworkError) {
      const queueType = error.config?.headers?.['X-Queue-Offline']
      if (queueType && error.config.data) {
        try {
          const payload = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data
          const id = await enqueueSyncItem(queueType, payload)
          
          // Return a mock successful response to the caller
          return Promise.resolve({
            data: { success: true, offline: true, id, message: 'Saved offline and queued for sync.' },
            status: 202,
            statusText: 'Accepted Offline',
            headers: {}
          })
        } catch (e) {
          console.error('Failed to queue offline item', e)
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
