import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Package, Truck, RotateCcw, User, Printer, ChevronRight, Sparkles } from 'lucide-react';
import SaudiRiyalSymbol from '../../components/storefront/SaudiRiyalSymbol';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';
import storeApi from '../../lib/storeApi';
import { optimizeImageUrl } from '../../lib/imageOptimizer';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';

export default function StorefrontCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const purchaseFired = useRef(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    storeApi.get(`/orders/track?orderNumber=${orderNumber}`)
      .then(res => {
        const ord = res.data?.order || res.data;
        setOrder(ord);
        if (!purchaseFired.current && ord) {
          purchaseFired.current = true;
          firePixelEvent('Purchase', {
            content_ids: (ord.items || []).map(i => i.productId || i._id),
            content_type: 'product',
            contents: (ord.items || []).map(i => ({ id: i.productId || i._id, quantity: i.quantity, item_price: i.price })),
            num_items: (ord.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
            value: ord.totals?.total || ord.total || 0,
            currency: ord.currency || 'SAR',
            order_id: ord.orderNumber || orderNumber,
          });
        }
      })
      .catch(() => {
        if (!purchaseFired.current) {
          purchaseFired.current = true;
          firePixelEvent('Purchase', { content_type: 'product', value: 0, currency: 'SAR', order_id: orderNumber });
        }
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const orderTotal = order?.totals?.total || order?.total || 0;
  const orderItems = order?.items || [];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <StorefrontSeo title={`Order ${orderNumber} — Confirmed`} />

      {/* Hero success card */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
        borderRadius: '24px', padding: '48px 32px', textAlign: 'center', color: '#fff',
        position: 'relative', overflow: 'hidden', marginBottom: '24px',
        boxShadow: '0 20px 60px -15px rgba(79, 70, 229, 0.4)',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.2)',
          }}>
            <CheckCircle size={44} style={{ color: '#fff' }} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Thank You!</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: '0 0 20px' }}>Your order has been placed successfully 🎉</p>
          {orderNumber && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '8px 20px',
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '18px', fontWeight: 700 }}>Order #{orderNumber}</span>
            </div>
          )}
          {orderTotal > 0 && (
            <p style={{ fontSize: '15px', opacity: 0.85, margin: '16px 0 0' }}>
              Total: <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{orderTotal} <SaudiRiyalSymbol size={12} color="#fff" /></strong> · {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Order items preview */}
      {orderItems.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px',
          padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orderItems.slice(0, 4).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.image && <img src={optimizeImageUrl(item.image, { width: 100, quality: 80 })} alt={item.title} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>Qty: {item.quantity}</p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}>{(item.price * item.quantity).toFixed(0)} <SaudiRiyalSymbol size={11} color="#059669" /></span>
              </div>
            ))}
            {orderItems.length > 4 && (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '4px 0 0' }}>+ {orderItems.length - 4} more items</p>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px',
        padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={22} style={{ color: '#059669' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#111' }}>Order Confirmed</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>We'll process your order shortly</p>
          </div>
          <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
        </div>

        <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 20px 58px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', opacity: 0.5 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={22} style={{ color: '#9ca3af' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#6b7280' }}>Shipping</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>You'll receive updates as your order ships</p>
          </div>
        </div>

        <div style={{ height: '1px', background: '#f3f4f6', margin: '0 0 20px 58px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: 0.5 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={22} style={{ color: '#9ca3af' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#6b7280' }}>Delivered</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Estimated 3-7 business days</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {[
          { to: '/store/track-order', icon: Package, color: '#4f46e5', label: 'Track Your Order' },
          { to: '/store/account', icon: User, color: '#4f46e5', label: 'View My Orders' },
          { to: '/store/returns', icon: RotateCcw, color: '#f59e0b', label: 'Return an Item' },
        ].map((action, i) => (
          <Link key={i} to={action.to} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', textDecoration: 'none',
            transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <action.icon size={20} style={{ color: action.color }} />
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>{action.label}</span>
            </div>
            <ChevronRight size={18} style={{ color: '#9ca3af' }} />
          </Link>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => window.print()} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px',
          border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', cursor: 'pointer',
          fontWeight: 600, fontSize: '14px', color: '#374151', transition: 'all 0.2s',
        }}>
          <Printer size={18} /> Print Receipt
        </button>
        <Link to="/store" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px',
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff',
          borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s',
        }}>
          Continue Shopping →
        </Link>
      </div>
    </div>
  );
}
