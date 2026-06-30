import React, { useState } from 'react';
import { RotateCcw, Search, Package, CheckCircle, XCircle, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

const REASONS = [
  { value: 'damaged', label: 'Item arrived damaged' },
  { value: 'wrong_item', label: 'Received wrong item' },
  { value: 'not_as_described', label: 'Item not as described' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'other', label: 'Other' },
];

const RETURN_STATUS_CONFIG = {
  requested: { icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7', label: 'Return Requested' },
  approved: { icon: CheckCircle, color: '#3b82f6', bg: '#dbeafe', label: 'Approved' },
  rejected: { icon: XCircle, color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
  received: { icon: Package, color: '#8b5cf6', bg: '#ede9fe', label: 'Return Received' },
  refunded: { icon: CheckCircle, color: '#06b6d4', bg: '#cffafe', label: 'Refunded' },
  completed: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: 'Completed' },
};

export default function StorefrontReturnRequest() {
  const [step, setStep] = useState('lookup'); // lookup -> select -> reason -> confirm -> success
  const [form, setForm] = useState({ orderNumber: '', phone: '', email: '' });
  const [order, setOrder] = useState(null);
  const [existingReturn, setExistingReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [returnResult, setReturnResult] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!form.orderNumber) { setError('Order number is required'); return; }
    if (!form.phone && !form.email) { setError('Phone or email is required'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    setExistingReturn(null);
    try {
      const res = await storeApi.post('/track-order', form);
      setOrder(res.data);
      // Check for existing return
      try {
        const retRes = await storeApi.post('/returns/status', { orderId: res.data._id, phone: form.phone, email: form.email });
        if (retRes.data.return) setExistingReturn(retRes.data.return);
      } catch {}
      setStep('select');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find order');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (idx) => {
    setSelectedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
    if (!itemQuantities[idx]) {
      const item = order.items[idx];
      setItemQuantities(prev => ({ ...prev, [idx]: item.quantity }));
    }
  };

  const getSelectedItems = () => {
    return order.items
      .map((item, idx) => ({ ...item, idx }))
      .filter((item, idx) => selectedItems[idx])
      .map(item => ({
        productTitle: item.title,
        price: item.price,
        quantity: itemQuantities[item.idx] || 1,
        returnReason: reason,
      }));
  };

  const handleSubmit = async () => {
    const items = getSelectedItems();
    if (items.length === 0) { setError('Select at least one item to return'); return; }
    if (!reason) { setError('Please select a return reason'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await storeApi.post('/returns/request', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        phone: form.phone,
        email: form.email,
        items,
        reason,
        reasonDetails,
      });
      setReturnResult(res.data);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' };
  const canReturn = order && ['delivered', 'completed'].includes(order.status);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Return Request" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Return Request' }]} />

      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #4f46e520, #4f46e510)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <RotateCcw size={32} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>Return Request</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Submit a return request for items from your order</p>
      </div>

      {/* Step: Lookup */}
      {step === 'lookup' && (
        <form onSubmit={handleLookup} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>Enter either phone or email used when placing the order.</p>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
            fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
          }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Find Order</>}
          </button>
        </form>
      )}

      {/* Step: Select items */}
      {step === 'select' && order && (
        <div>
          {existingReturn ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {(() => {
                const cfg = RETURN_STATUS_CONFIG[existingReturn.status] || RETURN_STATUS_CONFIG.requested;
                const Icon = cfg.icon;
                return (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                      <Icon size={30} style={{ color: cfg.color }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.3px' }}>{cfg.label}</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 18px' }}>
                      Return #{existingReturn.returnNumber} for order #{order.orderNumber}
                    </p>
                    <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '18px', textAlign: 'left', marginBottom: '18px' }}>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }}>Items being returned:</p>
                      {existingReturn.items.map((item, i) => (
                        <p key={i} style={{ fontSize: '14px', margin: '4px 0' }}>{item.productTitle} × {item.quantity}</p>
                      ))}
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '14px' }}>
                        Refund: {existingReturn.refundAmount} {order.currency}
                      </p>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                      Submitted on {new Date(existingReturn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : !canReturn ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
              <AlertCircle size={44} style={{ color: '#f59e0b', margin: '0 auto 14px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.3px' }}>Returns not available</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 18px' }}>
                Returns can only be requested for delivered or completed orders.
                Your order status is: <strong>{order.status}</strong>
              </p>
              <button onClick={() => setStep('lookup')} style={{
                padding: '12px 28px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}>Look Up Another Order</button>
            </div>
          ) : (
            <div>
              {/* Order summary */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '18px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Order #{order.orderNumber}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{new Date(order.createdAt).toLocaleDateString()} · {order.itemCount} items</p>
                  </div>
                  <button onClick={() => setStep('lookup')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                    Change
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Select items to return</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{
                    background: '#fff', border: `2px solid ${selectedItems[idx] ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s',
                  }} onClick={() => toggleItem(idx)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="checkbox" checked={!!selectedItems[idx]} onChange={() => toggleItem(idx)} onClick={e => e.stopPropagation()} style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{item.title}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>{item.price} {order.currency} each</p>
                      </div>
                      {selectedItems[idx] && (
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Qty:</label>
                          <select
                            value={itemQuantities[idx] || 1}
                            onChange={e => setItemQuantities(prev => ({ ...prev, [idx]: parseInt(e.target.value) }))}
                            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
                          >
                            {Array.from({ length: item.quantity }, (_, i) => i + 1).map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reason selection */}
              {Object.values(selectedItems).some(v => v) && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Return reason</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    {REASONS.map(r => (
                      <label key={r.value} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                        background: reason === r.value ? '#eef2ff' : '#fff', border: `1px solid ${reason === r.value ? '#4f46e5' : '#e5e7eb'}`,
                        borderRadius: '12px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
                      }}>
                        <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={e => setReason(e.target.value)} style={{ accentColor: '#4f46e5' }} />
                        {r.label}
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={reasonDetails}
                    onChange={e => setReasonDetails(e.target.value)}
                    placeholder="Additional details (optional)..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              )}

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', color: '#dc2626', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>{error}</div>}

              {Object.values(selectedItems).some(v => v) && reason && (
                <button onClick={handleSubmit} disabled={loading} style={{
                  width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
                  fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><RotateCcw size={18} /> Submit Return Request</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && returnResult && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '36px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} style={{ color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.3px' }}>Return Request Submitted!</h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 22px' }}>
            Your return request has been received. We'll review it and notify you via email.
          </p>
          <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '18px', marginBottom: '22px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Return Number</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#4f46e5', margin: 0 }}>{returnResult.returnNumber}</p>
          </div>
          <button onClick={() => { setStep('lookup'); setOrder(null); setSelectedItems({}); setReason(''); setReasonDetails(''); setReturnResult(null); }} style={{
            padding: '14px 32px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Submit Another Return
          </button>
        </div>
      )}

      {error && step === 'lookup' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 18px', color: '#dc2626', fontSize: '14px', marginTop: '16px', fontWeight: 600 }}>{error}</div>
      )}
    </div>
  );
}
