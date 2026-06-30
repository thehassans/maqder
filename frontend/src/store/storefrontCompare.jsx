import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CompareContext = createContext(null);
const MAX_COMPARE = 4;
const STORAGE_KEY = 'storefront_compare';

export function CompareProvider({ children }) {
  const [productIds, setProductIds] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setProductIds(stored.slice(0, MAX_COMPARE));
    } catch {}
  }, []);

  const persist = (ids) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const addToCompare = useCallback((productId) => {
    setProductIds(prev => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, productId];
      persist(next);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setProductIds(prev => {
      const next = prev.filter(id => id !== productId);
      persist(next);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((productId) => {
    setProductIds(prev => {
      let next;
      if (prev.includes(productId)) {
        next = prev.filter(id => id !== productId);
      } else if (prev.length < MAX_COMPARE) {
        next = [...prev, productId];
      } else {
        return prev;
      }
      persist(next);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setProductIds([]);
    persist([]);
  }, []);

  const isInCompare = useCallback((productId) => productIds.includes(productId), [productIds]);

  return (
    <CompareContext.Provider value={{ productIds, addToCompare, removeFromCompare, toggleCompare, clearCompare, isInCompare, count: productIds.length, maxCompare: MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
