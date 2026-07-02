import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, Trash2, ShoppingCart, Check } from 'lucide-react';
import SaudiRiyalSymbol from './SaudiRiyalSymbol';
import { optimizeImageUrl } from '../../lib/imageOptimizer';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';

export default function WishlistDrawer({ isOpen, onClose }) {
  const { items, removeItem, count, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { t, isRTL } = useI18n();

  if (!isOpen) return null;

  const handleAddToCart = (item) => {
    addItem({
      _id: item.productId,
      title: item.title,
      basePrice: item.price,
      images: item.image ? [{ url: item.image }] : [],
      seo: { slug: item.slug },
    }, 1);
    removeItem(item.productId);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: 0, [isRTL ? 'left' : 'right']: 0, bottom: 0, width: '380px', maxWidth: '90vw', zIndex: 200,
        background: '#fff', boxShadow: isRTL ? '8px 0 32px rgba(0,0,0,0.15)' : '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <Heart size={20} fill="#ec4899" color="#ec4899" /> {t('wishlist')} ({count})
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {count === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              <Heart size={44} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '15px' }}>{t('wishlistEmpty')}</p>
              <Link to="/store/products" onClick={onClose} style={{ display: 'inline-block', marginTop: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                {t('browseProducts')} →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(item => (
                <div key={item.productId} style={{ display: 'flex', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #f3f4f6' }}>
                  <Link to={`/store/products/${item.slug}`} onClick={onClose} style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.image && <img src={optimizeImageUrl(item.image, { width: 100, quality: 80 })} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/store/products/${item.slug}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    </Link>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#111', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '2px' }}>{item.price} <SaudiRiyalSymbol size={11} color="#111" /></p>
                    <button onClick={() => handleAddToCart(item)} style={{
                      padding: '7px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.2s',
                    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <ShoppingCart size={13} /> {t('addToCart')}
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {count > 1 && (
                <button onClick={clearWishlist} style={{
                  padding: '10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '10px', color: '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
                  {t('clearWishlist')}
                </button>
              )}
            </div>
          )}
        </div>

        {count > 0 && (
          <div style={{ padding: '18px 22px', borderTop: '1px solid #e5e7eb' }}>
            <Link to="/store/wishlist" onClick={onClose} style={{
              display: 'block', textAlign: 'center', padding: '14px', background: '#fff', color: '#4f46e5', border: '2px solid #4f46e5', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', transition: 'all 0.2s',
            }} onMouseEnter={e => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4f46e5'; }}>
              {t('viewAll')} ({count})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
