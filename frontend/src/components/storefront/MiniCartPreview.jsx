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
      <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.3)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', maxWidth: '90vw', zIndex: 200,
        background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} /> Cart ({cartCount})
          </h3>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 'bold', fontSize: '15px' }}>Your cart is empty</p>
              <Link to="/store/products" onClick={() => setIsOpen(false)} style={{ display: 'inline-block', marginTop: '12px', color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                Browse products →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(item => (
                <div key={item.key} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    {item.variantLabel && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>{item.variantLabel}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => updateQuantity(item.key, item.quantity - 1)} style={{ width: '24px', height: '24px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, item.quantity + 1)} style={{ width: '24px', height: '24px', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669' }}>{item.price * item.quantity} SAR</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <button onClick={() => removeItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => { toggleWishlist({ _id: item.productId, title: item.title, basePrice: item.price, images: item.image ? [{ url: item.image }] : [], seo: {} }); removeItem(item.key); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isInWishlist(item.productId) ? '#ec4899' : '#9ca3af', padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }} title="Save for later">
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
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{cartTotal} SAR</span>
            </div>
            <Link to="/store/checkout" onClick={() => setIsOpen(false)} style={{
              display: 'block', textAlign: 'center', padding: '14px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px',
            }}>
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
