import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Loader2, Package, RotateCcw, ChevronRight, CheckCircle, XCircle, Clock, Truck, ShoppingBag, Search, Download } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
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
  returned: { icon: RotateCcw, color: '#dc2626', bg: '#fee2e2', label: 'Returned' },
};

export default function StorefrontAccount() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState(null);
  const [returns, setReturns] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { addItem } = useCart();

  const handleDownloadReceipt = (order) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const itemsHtml = (order.items || []).map(i => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i.title}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${(i.price * i.quantity).toFixed(2)} ${order.currency}</td></tr>`).join('');
    win.document.write(`
      <html><head><title>Receipt ${order.orderNumber}</title>
      <style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111}
      h1{font-size:20px}h2{font-size:14px;color:#666}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
      th{background:#f5f5f5;padding:8px;text-align:left;font-size:12px}
      .total{font-size:16px;font-weight:bold;margin-top:12px;text-align:right}
      .info{background:#f9fafb;border-radius:8px;padding:12px;margin:12px 0;font-size:13px}
      @media print{body{padding:0}}</style></head><body>
      <h1>Order Receipt</h1>
      <h2>Order #${order.orderNumber}</h2>
      <p style="color:#666;font-size:13px">${new Date(order.createdAt).toLocaleDateString('en',{day:'numeric',month:'long',year:'numeric'})}</p>
      <div class="info">
        <strong>Customer:</strong> ${order.customer?.name || ''}<br>
        ${order.customer?.phone ? '<strong>Phone:</strong> ' + order.customer.phone + '<br>' : ''}
        ${order.customer?.email ? '<strong>Email:</strong> ' + order.customer.email : ''}
      </div>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      <div class="total">Total: ${order.total} ${order.currency}</div>
      <div class="info"><strong>Payment:</strong> ${order.paymentMethod || 'COD'} — ${order.paymentStatus || 'Pending'}<br><strong>Shipping:</strong> ${order.shippingStatus || 'Unfulfilled'}${order.trackingNumber ? ' — Tracking: ' + order.trackingNumber : ''}</div>
      <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Thank you for your order!</p>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    win.document.close();
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Phone number is required'); return; }
    setLoading(true);
    setError('');
    setOrders(null);
    setReturns([]);
    try {
      const ordersRes = await storeApi.post('/track-orders', { phone: phone.trim() });
      setOrders(ordersRes.data.orders || []);
      // Fetch returns for each order
      for (const order of (ordersRes.data.orders || [])) {
        try {
          const retRes = await storeApi.post('/returns/status', { orderId: order._id, phone: phone.trim() });
          if (retRes.data.return) setReturns(prev => [...prev, retRes.data.return]);
        } catch {}
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No orders found');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order) => {
    if (!order.items) return;
    order.items.forEach(item => {
      addItem({
        productId: item.productId || item._id,
        title: item.title || item.productTitle,
        price: item.price,
        image: item.image || item.productImage,
        quantity: item.quantity,
      });
    });
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="My Account" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'My Account' }]} />

      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #4f46e520, #4f46e510)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <User size={32} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>My Account</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Enter your phone number to view your orders and returns</p>
      </div>

      <form onSubmit={handleLookup} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input style={{ ...inputStyle, paddingLeft: '42px' }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '12px 24px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
            fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
            transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
          }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Find Orders</>}
          </button>
        </div>
        {error && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '12px', fontWeight: 600 }}>{error}</p>}
      </form>

      {orders !== null && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>Your Orders ({orders.length})</h2>
            {returns.length > 0 && (
              <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', padding: '6px 14px', borderRadius: '999px', fontWeight: 700 }}>
                {returns.length} return{returns.length !== 1 ? 's' : ''} in progress
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Package size={40} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
              <p style={{ fontWeight: 700, color: '#6b7280', fontSize: '15px' }}>No orders found for this phone number</p>
              <Link to="/store/products" style={{ display: 'inline-block', marginTop: '14px', color: '#4f46e5', fontWeight: 700, textDecoration: 'none', fontSize: '15px' }}>Start shopping →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const isExpanded = expandedOrder === order.orderNumber;
                const orderReturn = returns.find(r => r.orderNumber === order.orderNumber);
                const canReturn = ['delivered', 'completed'].includes(order.status);
                const canReorder = order.status !== 'cancelled';

                return (
                  <div key={order.orderNumber} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; }} onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                    {/* Order header */}
                    <div
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderNumber)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} style={{ color: cfg.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>{order.orderNumber}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                          {new Date(order.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.itemCount} items · {order.total} {order.currency}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '5px 12px', borderRadius: '999px' }}>
                        {cfg.label}
                      </span>
                      <ChevronRight size={18} style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f3f4f6', padding: '18px' }}>
                        {/* Items */}
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #f9fafb' }}>
                              <span>{item.title} × {item.quantity}</span>
                              <span style={{ fontWeight: 700 }}>{item.price * item.quantity} {order.currency}</span>
                            </div>
                          ))}
                        </div>

                        {/* Shipping & Payment */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>Shipping</p>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{order.shippingStatus || 'Unfulfilled'}</p>
                            {order.trackingNumber && <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Tracking: {order.trackingNumber}</p>}
                          </div>
                          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>Payment</p>
                            <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>{order.paymentStatus || 'Pending'}</p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{order.paymentMethod || 'COD'}</p>
                          </div>
                        </div>

                        {/* Return status */}
                        {orderReturn && (
                          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RotateCcw size={16} style={{ color: '#f59e0b' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Return #{orderReturn.returnNumber}</p>
                              <p style={{ fontSize: '12px', color: '#92400e', margin: '2px 0 0' }}>Status: {orderReturn.status}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Link to={`/store/track-order`} state={{ orderNumber: order.orderNumber, phone }} style={{
                            padding: '10px 18px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(79,70,229,0.2)',
                          }}>
                            Track Order
                          </Link>
                          {canReturn && !orderReturn && (
                            <Link to={`/store/returns`} state={{ orderNumber: order.orderNumber, phone }} style={{
                              padding: '10px 18px', background: '#fff', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                            }}>
                              Request Return
                            </Link>
                          )}
                          {canReorder && (
                            <button onClick={() => handleReorder(order)} style={{
                              padding: '10px 18px', background: '#fff', color: '#059669', border: '1px solid #d1fae5', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                            }}>
                              <ShoppingBag size={14} /> Reorder
                            </button>
                          )}
                          <button onClick={() => handleDownloadReceipt(order)} style={{
                            padding: '10px 18px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                          }}>
                            <Download size={14} /> Receipt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
