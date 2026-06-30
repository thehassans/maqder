import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, Heart } from 'lucide-react';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';

export default function MiniCartPreview() {
  const { items, cartCount, cartTotal, isOpen, setIsOpen, removeItem, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', maxWidth: '90vw', zIndex: 200,
        background: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <ShoppingCart size={20} /> Cart ({cartCount})
          </h3>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Free shipping progress bar */}
          {items.length > 0 && (() => {
            const FREE_SHIP_THRESHOLD = 200;
            const remaining = Math.max(0, FREE_SHIP_THRESHOLD - cartTotal);
            const pct = Math.min(100, (cartTotal / FREE_SHIP_THRESHOLD) * 100);
            return (
              <div style={{ marginBottom: '16px', padding: '14px', background: '#f9fafb', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
                {remaining > 0 ? (
                  <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px' }}>Add <strong style={{ color: '#4f46e5' }}>{remaining} SAR</strong> more for free shipping!</p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#059669', fontWeight: 700, margin: '0 0 8px' }}>✓ You qualify for free shipping!</p>
                )}
                <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: remaining > 0 ? 'linear-gradient(90deg, #4f46e5, #6366f1)' : '#059669', borderRadius: '999px', transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })()}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              <ShoppingCart size={44} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '15px' }}>Your cart is empty</p>
              <Link to="/store/products" onClick={() => setIsOpen(false)} style={{ display: 'inline-block', marginTop: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                Browse products →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(item => (
                <div key={item.key} style={{ display: 'flex', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    {item.variantLabel && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>{item.variantLabel}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => updateQuantity(item.key, item.quantity - 1)} style={{ width: '26px', height: '26px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, item.quantity + 1)} style={{ width: '26px', height: '26px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>{item.price * item.quantity} SAR</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <button onClick={() => removeItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => { toggleWishlist({ _id: item.productId, title: item.title, basePrice: item.price, images: item.image ? [{ url: item.image }] : [], seo: {} }); removeItem(item.key); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isInWishlist(item.productId) ? '#ec4899' : '#9ca3af', padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Save for later">
                      <Heart size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '18px 22px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{cartTotal} SAR</span>
            </div>
            <Link to="/store/checkout" onClick={() => setIsOpen(false)} style={{
              display: 'block', textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
            }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)'; }}>
              Checkout
            </Link>
            <button onClick={() => setIsOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}>
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
