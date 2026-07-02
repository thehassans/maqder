import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Share2, Check } from 'lucide-react';
import SaudiRiyalSymbol from '../../components/storefront/SaudiRiyalSymbol';
import { optimizeImageUrl } from '../../lib/imageOptimizer';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCart } from '../../store/storefrontCart';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontWishlist() {
  const { items, removeItem, count } = useWishlist();
  const { addItem } = useCart();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const productIds = items.map(i => i.productId).join(',');
    const shareUrl = `${window.location.origin}/store/wishlist?ids=${productIds}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (count === 0) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <StorefrontSeo title="My Wishlist" />
        <Heart size={64} style={{ color: '#d1d5db', margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.3px' }}>Your wishlist is empty</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>Save items you love for later.</p>
        <Link to="/store/products" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>Browse products →</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo title="My Wishlist" />
      <StorefrontBreadcrumbs items={[{ label: 'Wishlist' }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>My Wishlist ({count})</h1>
        <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#4f46e5', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
          {copied ? <><Check size={16} /> Copied!</> : <><Share2 size={16} /> Share Wishlist</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
        {items.map(item => (
          <div key={item.productId} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
            <Link to={`/store/products/${item.slug}`}>
              <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                {item.image ? (
                  <img src={optimizeImageUrl(item.image, { width: 400, quality: 80 })} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                )}
              </div>
            </Link>
            <div style={{ padding: '14px' }}>
              <Link to={`/store/products/${item.slug}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: '#111', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              </Link>
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#059669', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '3px' }}>{item.price} <SaudiRiyalSymbol size={13} color="#059669" /></p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { addItem({ _id: item.productId, title: item.title, basePrice: item.price, images: item.image ? [{ url: item.image }] : [] }, 1); }} style={{
                  flex: 1, padding: '10px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(79,70,229,0.2)',
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <ShoppingCart size={14} /> Add
                </button>
                <button onClick={() => removeItem(item.productId)} style={{
                  padding: '10px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
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
