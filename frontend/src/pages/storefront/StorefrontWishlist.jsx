import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCart } from '../../store/storefrontCart';

export default function StorefrontWishlist() {
  const { items, removeItem, count } = useWishlist();
  const { addItem } = useCart();

  if (count === 0) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <Heart size={64} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Your wishlist is empty</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Save items you love for later.</p>
        <Link to="/store/products" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Browse products →</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>My Wishlist ({count})</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {items.map(item => (
          <div key={item.productId} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <Link to={`/store/products/${item.slug}`}>
              <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                {item.image ? (
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                )}
              </div>
            </Link>
            <div style={{ padding: '12px' }}>
              <Link to={`/store/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              </Link>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', margin: '0 0 12px' }}>{item.price} SAR</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { addItem({ _id: item.productId, title: item.title, basePrice: item.price, images: item.image ? [{ url: item.image }] : [] }, 1); }} style={{
                  flex: 1, padding: '8px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  <ShoppingCart size={14} /> Add
                </button>
                <button onClick={() => removeItem(item.productId)} style={{
                  padding: '8px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
