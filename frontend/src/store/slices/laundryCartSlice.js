import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customer: null,
  items: [], // { service: {}, quantity, unitPrice, subtotal, taxAmount, total }
  deliveryType: 'walk_in',
  notes: '',
};

const calculateItemTotals = (item) => {
  const subtotal = item.quantity * item.unitPrice;
  const taxRate = item.service.taxRate || 15;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { ...item, subtotal, taxAmount, total };
};

const laundryCartSlice = createSlice({
  name: 'laundryCart',
  initialState,
  reducers: {
    setCustomer: (state, action) => {
      state.customer = action.payload;
    },
    setDeliveryType: (state, action) => {
      state.deliveryType = action.payload;
    },
    setNotes: (state, action) => {
      state.notes = action.payload;
    },
    addItem: (state, action) => {
      const { service, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.service._id === service._id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        state.items[existingItemIndex].quantity += quantity;
        state.items[existingItemIndex] = calculateItemTotals(state.items[existingItemIndex]);
      } else {
        // Add new item
        state.items.push(calculateItemTotals({
          service,
          nameEn: service.nameEn,
          nameAr: service.nameAr,
          billingType: service.billingType,
          unitPrice: service.basePrice,
          quantity
        }));
      }
    },
    updateItemQuantity: (state, action) => {
      const { serviceId, quantity } = action.payload;
      const index = state.items.findIndex(item => item.service._id === serviceId);
      if (index >= 0) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
          state.items[index] = calculateItemTotals(state.items[index]);
        }
      }
    },
    removeItem: (state, action) => {
      const serviceId = action.payload;
      state.items = state.items.filter(item => item.service._id !== serviceId);
    },
    clearCart: () => initialState,
  }
});

export const { 
  setCustomer, setDeliveryType, setNotes, 
  addItem, updateItemQuantity, removeItem, clearCart 
} = laundryCartSlice.actions;

// Selectors
export const selectCartSubtotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.subtotal, 0);
export const selectCartTax = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.taxAmount, 0);
export const selectCartTotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.total, 0);

export default laundryCartSlice.reducer;
