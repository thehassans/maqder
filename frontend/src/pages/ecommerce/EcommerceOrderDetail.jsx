import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, X, AlertCircle, CheckCircle, Truck, CreditCard, MapPin, User, Package, Clock, Ban, Printer } from 'lucide-react';
import api from '../../lib/api';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
};

const VALID_NEXT = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['completed', 'returned'],
  completed: [],
  cancelled: [],
  returned: [],
};

export default function EcommerceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('');

  useEffect(() => {
    api.get(`/ecommerce/orders/${id}`)
      .then(res => {
        setOrder(res.data);
        setTrackingInput(res.data.shipping?.trackingNumber || '');
        setCourierInput(res.data.shipping?.courier || '');
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshOrder = async () => {
    const res = await api.get(`/ecommerce/orders/${id}`);
    setOrder(res.data);
  };

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/ecommerce/orders/${id}/status`, { status: newStatus });
      setOrder(res.data);
      setSuccess(`Order status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentUpdate = async (newStatus) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.patch(`/ecommerce/orders/${id}/payment`, { status: newStatus });
      setOrder(res.data);
      setSuccess(`Payment marked as ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShippingUpdate = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.patch(`/ecommerce/orders/${id}/shipping`, {
        trackingNumber: trackingInput,
        courier: courierInput,
      });
      setOrder(res.data);
      setSuccess('Shipping info updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update shipping');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/ecommerce/orders/${id}/cancel`, {});
      setOrder(res.data);
      setShowCancel(false);
      setSuccess('Order cancelled and items restocked');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Order not found</p>
        <Link to="/app/dashboard/ecommerce/orders" className="text-indigo-600 text-sm mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  const nextStatuses = VALID_NEXT[order.status] || [];
  const isTerminal = ['cancelled', 'completed', 'returned'].includes(order.status);

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/ecommerce/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{order.orderNumber}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>{order.status}</span>
            </div>
            <p className="text-sm text-gray-400">{fmtDate(order.createdAt)} · {order.source}</p>
          </div>
        </div>
        {!isTerminal && order.status !== 'cancelled' && (
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button onClick={() => setShowCancel(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50">
              <Ban className="w-4 h-4" /> Cancel Order
            </button>
          </div>
        )}
        {isTerminal && (
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Line items + timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" /> Line Items</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-dark-700/50">
              {order.lineItems.map((item, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center gap-3">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/dashboard/ecommerce/products/${item.productId}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 truncate block">
                      {item.productTitle}
                    </Link>
                    {item.variantLabel && <p className="text-xs text-gray-400">{item.variantLabel}</p>}
                    {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity} × {item.price} {order.currency}</p>
                    <p className="text-xs text-gray-400">{item.lineTotal} {order.currency}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-700 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold text-gray-700 dark:text-gray-300">{order.subtotal} {order.currency}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-semibold text-red-500">-{order.discount} {order.currency}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="font-semibold text-gray-700 dark:text-gray-300">{order.shippingCost} {order.currency}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-semibold text-gray-700 dark:text-gray-300">{order.taxTotal} {order.currency}</span></div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-100 dark:border-dark-700"><span className="font-black text-gray-900 dark:text-white">Total</span><span className="font-black text-indigo-600">{order.grandTotal} {order.currency}</span></div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-gray-400" /> Status Timeline</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${STATUS_STYLES[h.status]?.split(' ')[0] || 'bg-gray-200'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${STATUS_STYLES[h.status]?.split(' ')[1] || 'text-gray-600'}`}>{h.status}</span>
                      <span className="text-xs text-gray-400">{fmtDate(h.changedAt)}</span>
                    </div>
                    {h.note && <p className="text-xs text-gray-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Customer, Payment, Shipping, Actions */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><User className="w-4 h-4 text-gray-400" /> Customer</h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-gray-900 dark:text-white">{order.customer.name}</p>
              {order.customer.email && <p className="text-gray-500">{order.customer.email}</p>}
              {order.customer.phone && <p className="text-gray-500">{order.customer.phone}</p>}
            </div>
            {(order.customer.addressLine1 || order.customer.city) && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 text-sm text-gray-500 space-y-0.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase mb-1"><MapPin className="w-3 h-3" /> Shipping Address</p>
                {order.customer.addressLine1 && <p>{order.customer.addressLine1}</p>}
                {order.customer.addressLine2 && <p>{order.customer.addressLine2}</p>}
                <p>{[order.customer.city, order.customer.region, order.customer.postalCode].filter(Boolean).join(', ')}</p>
                <p>{order.customer.country}</p>
                {order.customer.notes && <p className="text-xs italic text-gray-400 mt-1">Note: {order.customer.notes}</p>}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><CreditCard className="w-4 h-4 text-gray-400" /> Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-bold text-gray-700 dark:text-gray-300 uppercase">{order.payment?.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold text-gray-700 dark:text-gray-300">{order.payment?.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-700 dark:text-gray-300">{order.payment?.amount} {order.currency}</span></div>
              {order.payment?.paidAt && <div className="flex justify-between"><span className="text-gray-500">Paid at</span><span className="text-gray-400 text-xs">{fmtDate(order.payment.paidAt)}</span></div>}
              {order.payment?.providerTransactionId && <div className="flex justify-between"><span className="text-gray-500">Txn ID</span><span className="text-gray-400 text-xs font-mono">{order.payment.providerTransactionId}</span></div>}
            </div>
            {order.payment?.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => handlePaymentUpdate('paid')} disabled={actionLoading} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">Mark Paid</button>
                <button onClick={() => handlePaymentUpdate('failed')} disabled={actionLoading} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 disabled:opacity-50">Mark Failed</button>
              </div>
            )}
            {order.payment?.status === 'paid' && (
              <button onClick={() => handlePaymentUpdate('refunded')} disabled={actionLoading} className="mt-3 w-full py-2 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 disabled:opacity-50">Mark Refunded</button>
            )}
          </div>

          {/* Shipping / Fulfillment */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3"><Truck className="w-4 h-4 text-gray-400" /> Fulfillment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-bold text-gray-700 dark:text-gray-300">{order.shipping?.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold text-gray-700 dark:text-gray-300">{order.shipping?.status}</span></div>
              {order.shipping?.fulfilledAt && <div className="flex justify-between"><span className="text-gray-500">Fulfilled</span><span className="text-gray-400 text-xs">{fmtDate(order.shipping.fulfilledAt)}</span></div>}
              {order.shipping?.deliveredAt && <div className="flex justify-between"><span className="text-gray-500">Delivered</span><span className="text-gray-400 text-xs">{fmtDate(order.shipping.deliveredAt)}</span></div>}
            </div>
            <div className="mt-3 space-y-2">
              <input
                value={courierInput}
                onChange={e => setCourierInput(e.target.value)}
                placeholder="Courier (e.g. SMSA, Aramex)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="Tracking number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleShippingUpdate} disabled={actionLoading} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
                {actionLoading ? 'Saving...' : 'Save Shipping Info'}
              </button>
            </div>
          </div>

          {/* Status actions */}
          {!isTerminal && nextStatuses.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Advance Status</h3>
              <div className="space-y-2">
                {nextStatuses.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={actionLoading}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50 ${
                      s === 'cancelled' || s === 'returned'
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {s === 'cancelled' ? 'Cancel Order' : s === 'returned' ? 'Mark Returned' : `Mark as ${s}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCancel(false)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Ban className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Cancel Order?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">This will cancel order {order.orderNumber} and restock all items. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Close</button>
              <button onClick={handleCancel} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">{actionLoading ? 'Cancelling...' : 'Cancel Order'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
