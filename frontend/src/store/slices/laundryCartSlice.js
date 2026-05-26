import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customer: null,
  items: [], // { service: {}, quantity, unitPrice, subtotal, taxAmount, total }
  deliveryType: 'walk_in',
  notes: '',
  isUrgent: false,
  urgentPrice: 10,
  customerName: '',
  customerPhone: '',
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
    setIsUrgent: (state, action) => {
      state.isUrgent = action.payload;
    },
    setUrgentPrice: (state, action) => {
      state.urgentPrice = Number(action.payload) || 0;
    },
    setCustomerName: (state, action) => {
      state.customerName = action.payload;
    },
    setCustomerPhone: (state, action) => {
      state.customerPhone = action.payload;
    },
    addItem: (state, action) => {
      const { service, product, quantity, treatment, customizations, unitPrice } = action.payload;
      
      const isProduct = Boolean(product);
      const itemId = isProduct ? product._id : service._id;
      const price = unitPrice !== undefined ? Number(unitPrice) : (isProduct ? product.sellingPrice : service.basePrice);
      
      const cartItemId = isProduct
        ? `prod-${itemId}-${price}`
        : `${itemId}-${treatment || 'default'}-${(customizations || []).join('-')}-${price}`;
        
      const existingItemIndex = state.items.findIndex(item => item.cartItemId === cartItemId);
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += quantity;
        state.items[existingItemIndex] = calculateItemTotals(state.items[existingItemIndex]);
      } else {
        const itemObj = {
          cartItemId,
          quantity,
          unitPrice: price,
          treatment: isProduct ? 'None' : (treatment || service.treatments?.[0] || 'Wash & Fold'),
          customizations: isProduct ? [] : (customizations || [])
        };
        
        if (isProduct) {
          itemObj.product = product;
          itemObj.nameEn = product.nameEn;
          itemObj.nameAr = product.nameAr || product.nameEn;
          itemObj.billingType = 'per_piece';
          const taxRate = product.taxRate !== undefined ? product.taxRate : 15;
          itemObj.service = { taxRate }; // to keep backward compatibility with calculateItemTotals helper
        } else {
          itemObj.service = service;
          itemObj.nameEn = service.nameEn;
          itemObj.nameAr = service.nameAr;
          itemObj.billingType = service.billingType;
        }
        
        state.items.push(calculateItemTotals(itemObj));
      }
    },
    updateItemQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const index = state.items.findIndex(item => item.cartItemId === cartItemId);
      if (index >= 0) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
          state.items[index] = calculateItemTotals(state.items[index]);
        }
      }
    },
    updateItemPrice: (state, action) => {
      const { cartItemId, unitPrice } = action.payload;
      const index = state.items.findIndex(item => item.cartItemId === cartItemId);
      if (index >= 0) {
        state.items[index].unitPrice = Number(unitPrice) || 0;
        state.items[index] = calculateItemTotals(state.items[index]);
      }
    },
    removeItem: (state, action) => {
      const cartItemId = action.payload;
      state.items = state.items.filter(item => item.cartItemId !== cartItemId);
    },
    clearCart: () => initialState,
  }
});

export const { 
  setCustomer, setDeliveryType, setNotes, setIsUrgent, setUrgentPrice,
  setCustomerName, setCustomerPhone,
  addItem, updateItemQuantity, updateItemPrice, removeItem, clearCart 
} = laundryCartSlice.actions;

// Selectors
export const selectCartSubtotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.subtotal, 0);
export const selectCartTax = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.taxAmount, 0);
export const selectCartTotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.total, 0);

export default laundryCartSlice.reducer;
