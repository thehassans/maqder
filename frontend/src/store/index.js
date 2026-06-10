import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import laundryCartReducer from './slices/laundryCartSlice'
import networkReducer from './slices/networkSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    laundryCart: laundryCartReducer,
    network: networkReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export default store
