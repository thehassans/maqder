import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Loader2, ListOrdered, ChevronRight, Download } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

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
  const [multiOrders, setMultiOrders] = useState(null);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState('');
  const [multiPhone, setMultiPhone] = useState('');

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

  const handleMultiLookup = async (e) => {
    e.preventDefault();
    if (!multiPhone) { setMultiError('Phone number is required'); return; }
    setMultiLoading(true);
    setMultiError('');
    setMultiOrders(null);
    try {
      const res = await storeApi.post('/track-orders', { phone: multiPhone });
      setMultiOrders(res.data.orders);
    } catch (err) {
      setMultiError(err.response?.data?.error || 'No orders found');
    } finally {
      setMultiLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Track Your Order" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Track Order' }]} />
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #4f46e520, #4f46e510)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Package size={32} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>Track Your Order</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Enter your order number and phone or email to see your order status</p>
      </div>

      <form onSubmit={handleTrack} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Order Number *</label>
          <input style={inputStyle} value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} placeholder="e.g. ORD-2024-001" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Enter either phone or email — whichever you used when placing the order.</p>
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
          fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
        }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Track Order</>}
        </button>
      </form>

      {/* Multi-order lookup */}
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '24px 0', paddingTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ListOrdered size={18} color="#4f46e5" />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Find all my orders</h2>
        </div>
        <form onSubmit={handleMultiLookup} style={{ display: 'flex', gap: '8px' }}>
          <input style={{ ...inputStyle, flex: 1 }} value={multiPhone} onChange={e => setMultiPhone(e.target.value)} placeholder="Enter your phone number" />
          <button type="submit" disabled={multiLoading} style={{ padding: '12px 22px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: multiLoading ? 0.6 : 1, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1' }>
            {multiLoading ? <Loader2 size={16} className="animate-spin" /> : 'Find Orders'}
          </button>
        </form>
        {multiError && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px' }}>{multiError}</p>}
        {multiOrders && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {multiOrders.map(o => {
              const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={o.orderNumber} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px 18px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{o.orderNumber}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} items · {o.total} {o.currency}</p>
                  </div>
                  <button onClick={() => { setForm({ ...form, orderNumber: o.orderNumber, phone: multiPhone }); setMultiOrders(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', flexShrink: 0 }}>
                    <ChevronRight size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

      {order && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {/* Status header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            {(() => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={26} style={{ color: cfg.color }} />
                </div>
              );
            })()}
            <div>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>{STATUS_CONFIG[order.status]?.label || order.status}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Order #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Order items */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items ({order.itemCount})</h3>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <span>{item.title} × {item.quantity}</span>
                <span style={{ fontWeight: 700 }}>{item.price * item.quantity} {order.currency}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', fontSize: '18px', fontWeight: 800 }}>
              <span>Total</span><span style={{ color: '#059669' }}>{order.total} {order.currency}</span>
            </div>
          </div>

          {/* Shipping & Payment info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>Shipping</p>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{order.shippingStatus}</p>
              {order.trackingNumber && <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Tracking: {order.trackingNumber}</p>}
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>Payment</p>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{order.paymentStatus}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{order.paymentMethod}</p>
            </div>
          </div>

          {/* Download receipt */}
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => {
              const win = window.open('', '_blank');
              if (!win) return;
              const itemsHtml = (order.items || []).map(i => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i.title}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${(i.price * i.quantity).toFixed(2)} ${order.currency}</td></tr>`).join('');
              win.document.write(`<html><head><title>Receipt ${order.orderNumber}</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111}h1{font-size:20px}h2{font-size:14px;color:#666}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}th{background:#f5f5f5;padding:8px;text-align:left;font-size:12px}.total{font-size:16px;font-weight:bold;margin-top:12px;text-align:right}.info{background:#f9fafb;border-radius:8px;padding:12px;margin:12px 0;font-size:13px}@media print{body{padding:0}}</style></head><body><h1>Order Receipt</h1><h2>Order #${order.orderNumber}</h2><p style="color:#666;font-size:13px">${new Date(order.createdAt).toLocaleDateString('en',{day:'numeric',month:'long',year:'numeric'})}</p><div class="info"><strong>Customer:</strong> ${order.customer?.name || ''}<br>${order.customer?.phone ? '<strong>Phone:</strong> ' + order.customer.phone + '<br>' : ''}${order.customer?.email ? '<strong>Email:</strong> ' + order.customer.email : ''}</div><table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total">Total: ${order.total} ${order.currency}</div><div class="info"><strong>Payment:</strong> ${order.paymentMethod || 'COD'} \u2014 ${order.paymentStatus || 'Pending'}<br><strong>Shipping:</strong> ${order.shippingStatus || 'Unfulfilled'}${order.trackingNumber ? ' \u2014 Tracking: ' + order.trackingNumber : ''}</div><p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Thank you for your order!</p><script>window.onload=()=>window.print()</script></body></html>`);
              win.document.close();
            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 22px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
              <Download size={16} /> Download Receipt
            </button>
          </div>

          {/* Status timeline */}
          {order.statusHistory?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '14px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</h3>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {order.statusHistory.map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} style={{ position: 'relative', paddingBottom: '18px' }}>
                      {i < order.statusHistory.length - 1 && (
                        <div style={{ position: 'absolute', left: '-17px', top: '24px', bottom: '0', width: '2px', background: '#e5e7eb' }} />
                      )}
                      <div style={{ position: 'absolute', left: '-24px', width: '14px', height: '14px', borderRadius: '50%', background: cfg.color, top: '4px', boxShadow: `0 0 0 4px ${cfg.bg}` }} />
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{cfg.label}</p>
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
