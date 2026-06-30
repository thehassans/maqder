import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ShoppingCart, Download, Printer } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontCheckout() {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart, cartId, setCartEmail, trackCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    addressLine1: '', addressLine2: '', city: '', region: '', postalCode: '', country: 'Saudi Arabia', notes: '',
  });

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'email' && value) {
      setCartEmail(value);
      trackCart(value);
    }
  };

  // Fire InitiateCheckout pixel event
  useEffect(() => {
    if (items.length > 0) {
      firePixelEvent('InitiateCheckout', {
        content_ids: items.map(i => i.productId),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        value: cartTotal,
        currency: 'SAR',
      });
    }
  }, []); // fire once on mount

  // Fetch shipping estimate
  useEffect(() => {
    if (items.length > 0) {
      storeApi.post('/shipping/estimate', { subtotal: cartTotal })
        .then(res => setShippingEstimate(res.data))
        .catch(() => setShippingEstimate(null));
    }
  }, [cartTotal, items.length]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await storeApi.post('/coupons/validate', { code: couponCode, subtotal: cartTotal });
      setAppliedCoupon(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyGiftCard = async (e) => {
    e.preventDefault();
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    setGiftCardError('');
    try {
      const res = await storeApi.post('/gift-card/check', { code: giftCardCode });
      setAppliedGiftCard(res.data);
    } catch (err) {
      setGiftCardError(err.response?.data?.error || 'Invalid gift card');
      setAppliedGiftCard(null);
    } finally {
      setGiftCardLoading(false);
    }
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const freeShipping = appliedCoupon?.freeShipping || shippingEstimate?.freeShipping || false;
  const shippingCost = freeShipping ? 0 : (shippingEstimate?.shippingCost || 0);
  const giftCardAmount = appliedGiftCard ? Math.min(appliedGiftCard.balance, Math.max(0, cartTotal - discountAmount + shippingCost)) : 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount + shippingCost - giftCardAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    if (items.length === 0) { setError('Cart is empty'); return; }

    setLoading(true);
    setError('');
    try {
      const orderItems = items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      const res = await storeApi.post('/orders', { customer: form, items: orderItems, paymentMethod, giftCardCode: appliedGiftCard?.code });
      const { orderId, orderNumber } = res.data;

      // If online payment, initiate checkout
      if (paymentMethod !== 'cod') {
        const checkoutRes = await storeApi.post(`/checkout/${orderId}`, { provider: paymentMethod });
        if (checkoutRes.data.checkoutUrl) {
          window.location.href = checkoutRes.data.checkoutUrl;
          return;
        }
      }

      // Mark abandoned cart as recovered
      if (cartId) {
        try { await storeApi.post(`/abandoned-carts/recover/${cartId}`, { orderId }); } catch {}
      }
      clearCart();
      setSuccess({ orderNumber, orderId });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <StorefrontSeo title={`Order ${success.orderNumber} — Confirmed`} />
        <CheckCircle size={64} style={{ color: '#059669', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Order Placed Successfully!</h1>
        <p style={{ color: '#6b7280', marginBottom: '8px' }}>Your order number is</p>
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '24px' }}>{success.orderNumber}</p>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>What happens next?</h3>
          <ul style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
            <li>You'll receive a confirmation call/SMS shortly</li>
            <li>Track your order anytime at our <Link to="/store/track-order" style={{ color: '#4f46e5', fontWeight: 'bold' }}>Order Tracking</Link> page</li>
            <li>Use your order number <strong>{success.orderNumber}</strong> and phone number to check status</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>
            <Printer size={16} /> Print Receipt
          </button>
          <Link to="/store" style={{ display: 'inline-block', padding: '12px 28px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <ShoppingCart size={64} style={{ color: '#d1d5db', margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.3px' }}>Your cart is empty</h1>
        <Link to="/store/products" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>Browse products →</Link>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo title="Checkout" />
      <StorefrontBreadcrumbs items={[{ label: 'Checkout' }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>Checkout</h1>
        <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', padding: '6px 14px', borderRadius: '999px', fontWeight: 700 }}>Guest Checkout — No account needed</span>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '14px', fontWeight: 600 }}><AlertCircle size={16} /> {error}</div>}

      <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }} className="store-checkout-grid">
        {/* Left: Customer info */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>Shipping Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} required />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Address Line 1</label>
            <input style={inputStyle} value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)} placeholder="Street address" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Region / Province</label>
              <input style={inputStyle} value={form.region} onChange={e => update('region', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Postal Code</label>
              <input style={inputStyle} value={form.postalCode} onChange={e => update('postalCode', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input style={inputStyle} value={form.country} onChange={e => update('country', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Order Notes</label>
            <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Optional notes for the seller" />
          </div>

          {/* Payment method */}
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '28px', marginBottom: '14px', letterSpacing: '-0.3px' }}>Payment Method</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', border: paymentMethod === 'cod' ? '2px solid #4f46e5' : '1px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', background: paymentMethod === 'cod' ? '#eef2ff' : '#fff' }}>
              <input type="radio" checked={paymentMethod === 'cod'} onChange={() => { setPaymentMethod('cod'); firePixelEvent('AddPaymentInfo', { value: finalTotal, currency: 'SAR', payment_method: 'cod' }); }} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Cash on Delivery</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', border: paymentMethod === 'moyasar' ? '2px solid #4f46e5' : '1px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', background: paymentMethod === 'moyasar' ? '#eef2ff' : '#fff' }}>
              <input type="radio" checked={paymentMethod === 'moyasar'} onChange={() => { setPaymentMethod('moyasar'); firePixelEvent('AddPaymentInfo', { value: finalTotal, currency: 'SAR', payment_method: 'moyasar' }); }} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Credit Card</span>
            </label>
          </div>
        </div>

        {/* Right: Order summary */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '24px', position: 'sticky', top: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>Order Summary</h2>
            <div style={{ marginBottom: '16px' }}>
              {items.map(item => (
                <div key={item.key} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  {item.image && <img src={item.image} alt="" style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Qty: {item.quantity} × {item.price} SAR</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px', fontWeight: 500 }}>
              <span>Subtotal</span><span style={{ fontWeight: 700 }}>{cartTotal} SAR</span>
            </div>
            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code" style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
              <button type="submit" disabled={couponLoading} style={{ padding: '10px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{couponLoading ? '...' : 'Apply'}</button>
            </form>
            {couponError && <p style={{ fontSize: '12px', color: '#dc2626', margin: '0 0 8px' }}>{couponError}</p>}
            {appliedCoupon && <p style={{ fontSize: '12px', color: '#059669', margin: '0 0 8px', fontWeight: 'bold' }}>✓ {appliedCoupon.code} applied — {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% off` : appliedCoupon.type === 'fixed' ? `${appliedCoupon.value} SAR off` : 'Free shipping'}</p>}
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: '#059669' }}>
                <span>Discount</span><span style={{ fontWeight: 'bold' }}>-{discountAmount} SAR</span>
              </div>
            )}
            {/* Gift card input */}
            <form onSubmit={handleApplyGiftCard} style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
              <input value={giftCardCode} onChange={e => setGiftCardCode(e.target.value)} placeholder="Gift card code" style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
              <button type="submit" disabled={giftCardLoading} style={{ padding: '10px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{giftCardLoading ? '...' : 'Apply'}</button>
            </form>
            {giftCardError && <p style={{ fontSize: '12px', color: '#dc2626', margin: '0 0 8px' }}>{giftCardError}</p>}
            {appliedGiftCard && <p style={{ fontSize: '12px', color: '#059669', margin: '0 0 8px', fontWeight: 'bold' }}>✓ Gift card applied — {giftCardAmount} SAR deducted</p>}
            {giftCardAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: '#059669' }}>
                <span>Gift Card</span><span style={{ fontWeight: 'bold' }}>-{giftCardAmount} SAR</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: '#6b7280' }}>
              <span>Shipping</span><span>{freeShipping ? 'Free' : shippingEstimate ? `${shippingCost} SAR` : 'Calculated at checkout'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, paddingTop: '14px', borderTop: '1px solid #e5e7eb', marginTop: '10px' }}>
              <span>Total</span><span style={{ color: '#059669' }}>{finalTotal} SAR</span>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
            }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Place Order'}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        @media(max-width:768px){.store-checkout-grid{grid-template-columns:1fr!important}}
        @media(max-width:768px){.store-mobile-sticky-bar{display:flex!important}}
      `}</style>

      {/* Mobile sticky checkout bar */}
      <div className="store-mobile-sticky-bar" style={{
        display: 'none', position: 'fixed', bottom: '56px', left: 0, right: 0, zIndex: 90,
        background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px',
        alignItems: 'center', gap: '12px', boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Total</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#059669', margin: 0 }}>{finalTotal} SAR</p>
        </div>
        <button type="submit" form="checkout-form" disabled={loading} style={{
          padding: '14px 28px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
          fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.6 : 1, boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
        }}>
          {loading ? '...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
