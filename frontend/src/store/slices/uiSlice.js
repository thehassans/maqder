import { createSlice } from '@reduxjs/toolkit'

const getInitialLanguage = () => {
  const saved = localStorage.getItem('language')
  return saved || 'en'
}

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialHideSidebar = () => {
  const saved = localStorage.getItem('hideSidebar')
  return saved === 'true'
}

const getInitialHiddenMenuItems = () => {
  try {
    const saved = localStorage.getItem('hiddenMenuItems')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const initialState = {
  language: getInitialLanguage(),
  theme: getInitialTheme(),
  sidebarOpen: true,
  sidebarCollapsed: false,
  hideSidebar: getInitialHideSidebar(),
  hiddenMenuItems: getInitialHiddenMenuItems(),
  mobileMenuOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload
      localStorage.setItem('language', action.payload)
      document.documentElement.dir = action.payload === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload
    },
    setHideSidebar: (state, action) => {
      state.hideSidebar = action.payload
      localStorage.setItem('hideSidebar', String(action.payload))
    },
    toggleHideSidebar: (state) => {
      state.hideSidebar = !state.hideSidebar
      localStorage.setItem('hideSidebar', String(state.hideSidebar))
    },
    setHiddenMenuItems: (state, action) => {
      state.hiddenMenuItems = Array.isArray(action.payload) ? action.payload : []
      localStorage.setItem('hiddenMenuItems', JSON.stringify(state.hiddenMenuItems))
    },
    toggleHiddenMenuItem: (state, action) => {
      const path = action.payload
      const current = new Set(state.hiddenMenuItems || [])
      if (current.has(path)) {
        current.delete(path)
      } else {
        current.add(path)
      }
      state.hiddenMenuItems = Array.from(current)
      localStorage.setItem('hiddenMenuItems', JSON.stringify(state.hiddenMenuItems))
    },
  },
})

export const { setLanguage, setTheme, toggleSidebar, toggleSidebarCollapse, setMobileMenuOpen, setHideSidebar, toggleHideSidebar, setHiddenMenuItems, toggleHiddenMenuItem } = uiSlice.actions
export default uiSlice.reducer
