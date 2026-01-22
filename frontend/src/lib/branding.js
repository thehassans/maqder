function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function hexToRgb(hex) {
  if (!hex) return null
  const raw = String(hex).trim().replace('#', '')

  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }

  if (raw.length !== 6) return null
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function mix(a, b, weight) {
  const w = clamp(weight, 0, 1)
  return Math.round(a * (1 - w) + b * w)
}

function mixRgb(rgb, targetRgb, weight) {
  return {
    r: mix(rgb.r, targetRgb.r, weight),
    g: mix(rgb.g, targetRgb.g, weight),
    b: mix(rgb.b, targetRgb.b, weight)
  }
}

function rgbToCss(rgb) {
  return `${clamp(rgb.r, 0, 255)} ${clamp(rgb.g, 0, 255)} ${clamp(rgb.b, 0, 255)}`
}

function buildScale(baseRgb) {
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }

  return {
    50: mixRgb(baseRgb, white, 0.92),
    100: mixRgb(baseRgb, white, 0.84),
    200: mixRgb(baseRgb, white, 0.70),
    300: mixRgb(baseRgb, white, 0.52),
    400: mixRgb(baseRgb, white, 0.30),
    500: baseRgb,
    600: mixRgb(baseRgb, black, 0.12),
    700: mixRgb(baseRgb, black, 0.28),
    800: mixRgb(baseRgb, black, 0.42),
    900: mixRgb(baseRgb, black, 0.56),
    950: mixRgb(baseRgb, black, 0.72)
  }
}

function applyPalette(prefix, hex) {
  const baseRgb = hexToRgb(hex)
  if (!baseRgb) return

  const scale = buildScale(baseRgb)
  const root = document.documentElement

  root.style.setProperty(`--color-${prefix}`, rgbToCss(scale[500]))
  Object.entries(scale).forEach(([k, rgb]) => {
    root.style.setProperty(`--color-${prefix}-${k}`, rgbToCss(rgb))
  })
}

export function applyTenantBranding(branding) {
  if (typeof document === 'undefined') return
  if (!branding) return

  if (branding.primaryColor) {
    applyPalette('primary', branding.primaryColor)
  }

  if (branding.secondaryColor) {
    applyPalette('secondary', branding.secondaryColor)
  }

  const root = document.documentElement
  if (branding.headerStyle) root.dataset.headerStyle = branding.headerStyle
  if (branding.sidebarStyle) root.dataset.sidebarStyle = branding.sidebarStyle
}
