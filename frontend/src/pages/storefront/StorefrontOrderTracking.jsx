import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import storeApi from '../../lib/storeApi';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: '#3b82f6', bg: '#dbeafe', label: 'Confirmed' },
  processing: { icon: Package, color: '#8b5cf6', bg: '#ede9fe', label: 'Processing' },
  shipped: { icon: Truck, color: '#06b6d4', bg: '#cffafe', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: 'Delivered' },
  completed: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: 'Completed' },
  cancelled: { icon: XCircle, color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
  returned: { icon: XCircle, color: '#dc2626', bg: '#fee2e2', label: 'Returned' },
};

export default function StorefrontOrderTracking() {
  const [form, setForm] = useState({ orderNumber: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!form.orderNumber) { setError('Order number is required'); return; }
    if (!form.phone && !form.email) { setError('Phone or email is required'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await storeApi.post('/track-order', form);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to track order');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Package size={48} style={{ color: '#4f46e5', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>Track Your Order</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Enter your order number and phone or email to see your order status</p>
      </div>

      <form onSubmit={handleTrack} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Order Number *</label>
          <input style={inputStyle} value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} placeholder="e.g. ORD-2024-001" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Enter either phone or email — whichever you used when placing the order.</p>
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px',
          fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Track Order</>}
        </button>
      </form>

      {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', fontSize: '14px' }}>{error}</div>}

      {order && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          {/* Status header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {(() => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} style={{ color: cfg.color }} />
                </div>
              );
            })()}
            <div>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{STATUS_CONFIG[order.status]?.label || order.status}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Order #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Order items */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#6b7280' }}>ITEMS ({order.itemCount})</h3>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <span>{item.title} × {item.quantity}</span>
                <span style={{ fontWeight: 'bold' }}>{item.price * item.quantity} {order.currency}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', fontSize: '16px', fontWeight: 'bold' }}>
              <span>Total</span><span style={{ color: '#059669' }}>{order.total} {order.currency}</span>
            </div>
          </div>

          {/* Shipping & Payment info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>Shipping</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{order.shippingStatus}</p>
              {order.trackingNumber && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Tracking: {order.trackingNumber}</p>}
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>Payment</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{order.paymentStatus}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.paymentMethod}</p>
            </div>
          </div>

          {/* Status timeline */}
          {order.statusHistory?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#6b7280' }}>TIMELINE</h3>
              <div style={{ position: 'relative', paddingLeft: '20px' }}>
                {order.statusHistory.map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} style={{ position: 'relative', paddingBottom: '16px' }}>
                      {i < order.statusHistory.length - 1 && (
                        <div style={{ position: 'absolute', left: '-15px', top: '20px', bottom: '0', width: '2px', background: '#e5e7eb' }} />
                      )}
                      <div style={{ position: 'absolute', left: '-20px', width: '12px', height: '12px', borderRadius: '50%', background: cfg.color, top: '4px' }} />
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{cfg.label}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{new Date(h.date).toLocaleString()}</p>
                      {h.note && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{h.note}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
