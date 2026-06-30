import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storeApi from '../lib/storeApi';

const CartContext = createContext(null);

const STORAGE_KEY = 'maqder_store_cart';
const CART_ID_KEY = 'maqder_store_cart_id';
const EMAIL_KEY = 'maqder_store_customer_email';

function generateCartId() {
  return 'cart_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
      const savedId = localStorage.getItem(CART_ID_KEY);
      if (savedId) setCartId(savedId);
      const savedEmail = localStorage.getItem(EMAIL_KEY);
      if (savedEmail) setCustomerEmail(savedEmail);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const trackCart = useCallback(async (email) => {
    if (!cartId || items.length === 0) return;
    const emailToUse = email || customerEmail;
    if (!emailToUse) return;
    try {
      await storeApi.post('/abandoned-carts/track', {
        cartId,
        customerEmail: emailToUse,
        items: items.map(i => ({
          productId: i.productId,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        cartTotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      });
    } catch {
      // silent fail
    }
  }, [cartId, items, customerEmail]);

  const addItem = useCallback((product, quantity = 1, variantId = null) => {
    // Ensure cartId exists
    setCartId(prevId => {
      if (!prevId) {
        const newId = generateCartId();
        localStorage.setItem(CART_ID_KEY, newId);
        return newId;
      }
      return prevId;
    });
    setItems(prev => {
      const key = `${product._id}_${variantId || 'default'}`;
      const existing = prev.find(i => i.key === key);
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        key,
        productId: product._id,
        title: product.title,
        image: product.images?.[0]?.url || '',
        price: product.basePrice,
        variantId,
        variantLabel: '',
        quantity,
      }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(i => i.key === key ? { ...i, quantity } : i));
  }, []);

  const setCartEmail = useCallback((email) => {
    setCustomerEmail(email);
    localStorage.setItem(EMAIL_KEY, email);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Keep cartId for potential recovery tracking
  }, []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, cartCount, cartTotal,
      addItem, removeItem, updateQuantity, clearCart,
      isOpen, setIsOpen,
      cartId, customerEmail, setCartEmail, trackCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
