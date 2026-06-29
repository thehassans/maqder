import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import storeApi from '../../lib/storeApi';

const STORAGE_KEY = 'maqder_recently_viewed';
const MAX_ITEMS = 8;

export function trackProductView(product) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = existing.filter(p => p.id !== product._id);
    filtered.unshift({
      id: product._id,
      title: product.title,
      price: product.basePrice,
      image: product.images?.[0]?.url || null,
      slug: product.seo?.slug || product._id,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length < 2) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto 0', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Clock size={20} color="#6b7280" />
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Recently Viewed</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {items.map(item => (
          <Link key={item.id} to={`/store/products/${item.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', background: '#f3f4f6', overflow: 'hidden' }}>
                {item.image ? (
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '11px' }}>No image</div>
                )}
              </div>
              <div style={{ padding: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{item.price} SAR</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
