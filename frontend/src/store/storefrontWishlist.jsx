import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'maqder_storefront_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isInWishlist = (productId) => items.some(i => i.productId === productId);

  const toggleWishlist = (product) => {
    const productId = product._id;
    setItems(prev => {
      if (prev.some(i => i.productId === productId)) {
        return prev.filter(i => i.productId !== productId);
      }
      return [...prev, {
        productId,
        title: product.title,
        price: product.basePrice,
        image: product.images?.[0]?.url || null,
        slug: product.seo?.slug || productId,
        addedAt: Date.now(),
      }];
    });
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clearWishlist = () => setItems([]);

  const value = {
    items,
    count: items.length,
    isInWishlist,
    toggleWishlist,
    removeItem,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
