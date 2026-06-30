import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, Loader2, Package, RotateCcw, ChevronRight, CheckCircle, XCircle, Clock, Truck, ShoppingBag, Search } from 'lucide-react';
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

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="My Account" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'My Account' }]} />

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <User size={48} style={{ color: '#4f46e5', margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>My Account</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Enter your phone number to view your orders and returns</p>
      </div>

      <form onSubmit={handleLookup} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input style={{ ...inputStyle, paddingLeft: '40px' }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '12px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
          }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Find Orders</>}
          </button>
        </div>
        {error && <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '12px' }}>{error}</p>}
      </form>

      {orders !== null && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Your Orders ({orders.length})</h2>
            {returns.length > 0 && (
              <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: '999px', fontWeight: 'bold' }}>
                {returns.length} return{returns.length !== 1 ? 's' : ''} in progress
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Package size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 'bold', color: '#6b7280' }}>No orders found for this phone number</p>
              <Link to="/store/products" style={{ display: 'inline-block', marginTop: '12px', color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none' }}>Start shopping →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const isExpanded = expandedOrder === order.orderNumber;
                const orderReturn = returns.find(r => r.orderNumber === order.orderNumber);
                const canReturn = ['delivered', 'completed'].includes(order.status);
                const canReorder = order.status !== 'cancelled';

                return (
                  <div key={order.orderNumber} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Order header */}
                    <div
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderNumber)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} style={{ color: cfg.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 'bold', fontSize: '15px', margin: 0 }}>{order.orderNumber}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                          {new Date(order.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.itemCount} items · {order.total} {order.currency}
                        </p>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: '999px' }}>
                        {cfg.label}
                      </span>
                      <ChevronRight size={18} style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px' }}>
                        {/* Items */}
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 8px' }}>Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid #f9fafb' }}>
                              <span>{item.title} × {item.quantity}</span>
                              <span style={{ fontWeight: 'bold' }}>{item.price * item.quantity} {order.currency}</span>
                            </div>
                          ))}
                        </div>

                        {/* Shipping & Payment */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>Shipping</p>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{order.shippingStatus || 'Unfulfilled'}</p>
                            {order.trackingNumber && <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Tracking: {order.trackingNumber}</p>}
                          </div>
                          <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>Payment</p>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>{order.paymentStatus || 'Pending'}</p>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{order.paymentMethod || 'COD'}</p>
                          </div>
                        </div>

                        {/* Return status */}
                        {orderReturn && (
                          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RotateCcw size={16} style={{ color: '#f59e0b' }} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>Return #{orderReturn.returnNumber}</p>
                              <p style={{ fontSize: '12px', color: '#92400e', margin: '2px 0 0' }}>Status: {orderReturn.status}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Link to={`/store/track-order`} state={{ orderNumber: order.orderNumber, phone }} style={{
                            padding: '8px 16px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px',
                          }}>
                            Track Order
                          </Link>
                          {canReturn && !orderReturn && (
                            <Link to={`/store/returns`} state={{ orderNumber: order.orderNumber, phone }} style={{
                              padding: '8px 16px', background: '#fff', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px',
                            }}>
                              Request Return
                            </Link>
                          )}
                          {canReorder && (
                            <button onClick={() => handleReorder(order)} style={{
                              padding: '8px 16px', background: '#fff', color: '#059669', border: '1px solid #d1fae5', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            }}>
                              <ShoppingBag size={14} /> Reorder
                            </button>
                          )}
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
