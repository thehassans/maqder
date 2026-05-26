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
      
      // Determine default treatment and price
      let selectedTreatment = 'None';
      let price = 0;
      
      if (isProduct) {
        price = unitPrice !== undefined ? Number(unitPrice) : (product.sellingPrice || 0);
      } else {
        const defaultTreatmentObj = service.treatments?.find(t => t.nameEn === treatment) || service.treatments?.[0];
        selectedTreatment = defaultTreatmentObj ? defaultTreatmentObj.nameEn : 'Wash & Fold';
        price = unitPrice !== undefined ? Number(unitPrice) : (defaultTreatmentObj ? defaultTreatmentObj.price : (service.basePrice || 0));
      }
      
      // Cart item ID based on item type and selected treatment
      const cartItemId = isProduct
        ? `prod-${itemId}`
        : `service-${itemId}-${selectedTreatment}`;
        
      const existingItemIndex = state.items.findIndex(item => item.cartItemId === cartItemId);
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += quantity;
        state.items[existingItemIndex] = calculateItemTotals(state.items[existingItemIndex]);
      } else {
        const itemObj = {
          cartItemId,
          quantity,
          unitPrice: price,
          treatment: selectedTreatment,
          customizations: isProduct ? [] : (customizations || [])
        };
        
        if (isProduct) {
          itemObj.product = product;
          itemObj.nameEn = product.nameEn;
          itemObj.nameAr = product.nameAr || product.nameEn;
          itemObj.billingType = 'per_piece';
          const taxRate = product.taxRate !== undefined ? product.taxRate : 15;
          itemObj.service = { taxRate };
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
        const newQty = Number(quantity);
        if (newQty <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = newQty;
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
    updateItemTreatment: (state, action) => {
      const { cartItemId, treatmentName, unitPrice } = action.payload;
      const index = state.items.findIndex(item => item.cartItemId === cartItemId);
      if (index >= 0) {
        const item = state.items[index];
        const isProduct = Boolean(item.product);
        
        if (!isProduct) {
          item.treatment = treatmentName;
          item.unitPrice = Number(unitPrice);
          
          // Regenerate cartItemId because treatment changed
          const newCartItemId = `service-${item.service._id}-${treatmentName}`;
          
          // Check if there is already an item with this new ID
          const existingIndex = state.items.findIndex(it => it.cartItemId === newCartItemId);
          if (existingIndex >= 0 && existingIndex !== index) {
            // Merge them
            state.items[existingIndex].quantity += item.quantity;
            state.items[existingIndex] = calculateItemTotals(state.items[existingIndex]);
            state.items.splice(index, 1);
          } else {
            item.cartItemId = newCartItemId;
            state.items[index] = calculateItemTotals(item);
          }
        }
      }
    },
    updateItemCustomizations: (state, action) => {
      const { cartItemId, customizations } = action.payload;
      const index = state.items.findIndex(item => item.cartItemId === cartItemId);
      if (index >= 0) {
        state.items[index].customizations = customizations;
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
  addItem, updateItemQuantity, updateItemPrice, updateItemTreatment, updateItemCustomizations, removeItem, clearCart 
} = laundryCartSlice.actions;

// Selectors
export const selectCartSubtotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.subtotal, 0);
export const selectCartTax = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.taxAmount, 0);
export const selectCartTotal = (state) => state.laundryCart.items.reduce((sum, item) => sum + item.total, 0);

export default laundryCartSlice.reducer;
