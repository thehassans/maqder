import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../lib/api'

const token = localStorage.getItem('token')

const initialState = {
  user: null,
  tenant: null,
  token,
  isAuthenticated: false,
  isLoading: !!token, // Only loading if we have a token to verify
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, tenantSlug }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, tenantSlug })
      localStorage.setItem('token', data.token)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch (error) {
      localStorage.removeItem('token')
      return rejectWithValue(error.response?.data?.error || 'Session expired')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token')
  return null
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
    updateTenant: (state, action) => {
      state.tenant = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.tenant = action.payload.tenant
        state.token = action.payload.token
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(getMe.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.tenant = action.payload.tenant
      })
      .addCase(getMe.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.tenant = null
        state.token = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.tenant = null
        state.token = null
      })
  },
})

export const { clearError, updateUser, updateTenant } = authSlice.actions
export default authSlice.reducer
