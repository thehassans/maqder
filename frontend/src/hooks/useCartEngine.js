import { useState, useCallback, useRef } from 'react';

export const useCartEngine = () => {
  const [cartItems, setCartItems] = useState([]);
  
  const addItem = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product._id || item.primaryBarcode === product.primaryBarcode);
      if (existing) {
        return prev.map(item => 
          item.productId === product._id || item.primaryBarcode === product.primaryBarcode
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.retailPrice }
            : item
        );
      }
      return [...prev, {
        productId: product._id,
        productName: product.name,
        productNameAr: product.nameAr || product.name,
        primaryBarcode: product.primaryBarcode,
        quantity: 1,
        unitPrice: product.retailPrice,
        taxRate: product.taxRate || 15,
        lineTotal: product.retailPrice
      }];
    });
  }, []);

  const updateQuantity = useCallback((index, quantity) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setCartItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity, lineTotal: quantity * item.unitPrice }
        : item
    ));
  }, []);

  const removeItem = useCallback((index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totals = cartItems.reduce((acc, item) => {
    const totalWithTax = item.lineTotal; // retailPrice is tax-inclusive usually in Bakala, but let's assume standard logic
    // For ZATCA Phase 2, B2C prices are often displayed inclusive of tax.
    const taxAmount = (totalWithTax * item.taxRate) / (100 + item.taxRate);
    const taxableAmount = totalWithTax - taxAmount;
    
    return {
      subtotal: acc.subtotal + taxableAmount,
      taxAmount: acc.taxAmount + taxAmount,
      grandTotal: acc.grandTotal + totalWithTax
    };
  }, { subtotal: 0, taxAmount: 0, grandTotal: 0 });

  return {
    cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totals
  };
};
