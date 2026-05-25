import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import laundryCartReducer from './slices/laundryCartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    laundryCart: laundryCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export default store
