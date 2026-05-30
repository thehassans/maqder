// Provider-agnostic analytics wrapper.
// Config injected at runtime from Super Admin settings.

let initialized = false
let config = null

export function initAnalytics(cfg) {
  config = cfg
  if (!cfg?.enabled || !cfg?.apiKey) return
  initialized = true

  if (cfg.provider === 'posthog') {
    // PostHog lazy init
    if (typeof window !== 'undefined' && !window.posthog) {
      window.__analytics_provider__ = 'posthog'
    }
  } else if (cfg.provider === 'mixpanel') {
    window.__analytics_provider__ = 'mixpanel'
  }
}

export function track(event, properties = {}) {
  if (!initialized || !config?.enabled) return
  try {
    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'web',
      }
    }
    // If custom endpoint
    if (config.endpoint) {
      fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }
    // Console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties)
    }
  } catch {}
}

export function identify(userId, traits = {}) {
  if (!initialized) return
  track('$identify', { distinct_id: userId, ...traits })
}

export function page(name, properties = {}) {
  track('$pageview', { page_name: name, ...properties })
}

export default { initAnalytics, track, identify, page }
