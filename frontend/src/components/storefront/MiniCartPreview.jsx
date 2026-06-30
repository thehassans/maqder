import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, Heart, Tag, Gift, Check } from 'lucide-react';
import SaudiRiyalSymbol from './SaudiRiyalSymbol';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { useI18n } from '../../store/storefrontI18n';

export default function MiniCartPreview() {
  const { items, cartCount, cartTotal, isOpen, setIsOpen, removeItem, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, isRTL } = useI18n();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await storeApi.post('/coupons/validate', { code: couponCode, subtotal: cartTotal });
      setAppliedCoupon(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || t('invalidCoupon'));
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    setGiftCardError('');
    try {
      const res = await storeApi.post('/gift-card/check', { code: giftCardCode });
      setAppliedGiftCard(res.data);
    } catch (err) {
      setGiftCardError(err.response?.data?.error || t('invalidGiftCard'));
      setAppliedGiftCard(null);
    } finally {
      setGiftCardLoading(false);
    }
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const freeShipping = appliedCoupon?.freeShipping || false;
  const giftCardAmount = appliedGiftCard ? Math.min(appliedGiftCard.balance, Math.max(0, cartTotal - discountAmount)) : 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount - giftCardAmount);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, [isRTL ? 'left' : 'right']: 0, bottom: 0, width: '380px', maxWidth: '90vw', zIndex: 200,
        background: '#fff', boxShadow: isRTL ? '8px 0 32px rgba(0,0,0,0.15)' : '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
            <ShoppingCart size={20} /> {t('cart')} ({cartCount})
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
                  <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px' }}>{t('addMoreForFreeShipping')} <strong style={{ color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{remaining} <SaudiRiyalSymbol size={10} color="#4f46e5" /></strong> {t('forFreeShipping')}</p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#059669', fontWeight: 700, margin: '0 0 8px' }}>{t('unlockedFreeShipping')}</p>
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
              <p style={{ fontWeight: 700, fontSize: '15px' }}>{t('cartIsEmpty')}</p>
              <Link to="/store/products" onClick={() => setIsOpen(false)} style={{ display: 'inline-block', marginTop: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                {t('browseProducts')} →
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
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}>{item.price * item.quantity} <SaudiRiyalSymbol size={11} color="#059669" /></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, alignSelf: 'flex-start' }}>
                    <button onClick={() => removeItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => { toggleWishlist({ _id: item.productId, title: item.title, basePrice: item.price, images: item.image ? [{ url: item.image }] : [], seo: {} }); removeItem(item.key); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isInWishlist(item.productId) ? '#ec4899' : '#9ca3af', padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title={t('saveForLater')}>
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
            {/* Coupon input */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Tag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder={t('couponCode')} style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                </div>
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading} style={{ padding: '10px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{couponLoading ? '...' : t('apply')}</button>
              </div>
              {couponError && <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>{couponError}</p>}
              {appliedCoupon && <p style={{ fontSize: '11px', color: '#059669', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {appliedCoupon.code} applied</p>}
            </div>

            {/* Gift card input */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Gift size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input value={giftCardCode} onChange={e => setGiftCardCode(e.target.value)} placeholder={t('giftCardCode')} style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
                </div>
                <button type="button" onClick={handleApplyGiftCard} disabled={giftCardLoading} style={{ padding: '10px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{giftCardLoading ? '...' : t('apply')}</button>
              </div>
              {giftCardError && <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>{giftCardError}</p>}
              {appliedGiftCard && <p style={{ fontSize: '11px', color: '#059669', margin: '4px 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {t('giftCardApplied')}</p>}
            </div>

            {/* Totals */}
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#059669' }}>
                <span>{t('discount')}</span>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>-{discountAmount} <SaudiRiyalSymbol size={10} color="#059669" /></span>
              </div>
            )}
            {giftCardAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#059669' }}>
                <span>{t('giftCard')}</span>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>-{giftCardAmount} <SaudiRiyalSymbol size={10} color="#059669" /></span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{t('total')}</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>{finalTotal} <SaudiRiyalSymbol size={15} color="#059669" /></span>
            </div>
            <Link to="/store/checkout" onClick={() => setIsOpen(false)} style={{
              display: 'block', textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
            }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)'; }}>
              {t('checkout')}
            </Link>
            <button onClick={() => setIsOpen(false)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}>
              {t('continueShopping')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
