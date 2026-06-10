import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOnline: navigator.onLine,
  syncStatus: 'idle', // 'idle' | 'syncing' | 'error' | 'success'
  pendingItemsCount: 0,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setSyncStatus: (state, action) => {
      state.syncStatus = action.payload;
    },
    setPendingItemsCount: (state, action) => {
      state.pendingItemsCount = action.payload;
    },
  },
});

export const { setOnlineStatus, setSyncStatus, setPendingItemsCount } = networkSlice.actions;

export default networkSlice.reducer;
