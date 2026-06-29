import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'maqder_storefront_recently_viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
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

  const addProduct = useCallback((product) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.productId !== product._id);
      return [{
        productId: product._id,
        title: product.title,
        price: product.basePrice,
        image: product.images?.[0]?.url || null,
        slug: product.seo?.slug || product._id,
        viewedAt: Date.now(),
      }, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => setItems([]), []);

  return { items, addProduct, clearRecentlyViewed };
}
