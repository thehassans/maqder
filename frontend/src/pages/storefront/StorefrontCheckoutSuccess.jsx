import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Package, Truck, RotateCcw, User, Printer, ChevronRight } from 'lucide-react';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';

export default function StorefrontCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    firePixelEvent('Purchase', {
      content_type: 'product',
      value: 0,
      currency: 'SAR',
    });
    setLoading(false);
  }, [orderNumber]);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div style={{ maxWidth: '550px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <StorefrontSeo title={`Order ${orderNumber} — Confirmed`} />

      <CheckCircle size={72} style={{ color: '#059669', margin: '0 auto 20px' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Thank You!</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>Your order has been placed successfully.</p>
      {orderNumber && (
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '32px' }}>
          Order #{orderNumber}
        </p>
      )}

      {/* Status timeline */}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} style={{ color: '#059669' }} />
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Order Confirmed</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>We'll process your order shortly</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', opacity: 0.5 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} style={{ color: '#9ca3af' }} />
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Shipping</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>You'll receive updates as your order ships</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} style={{ color: '#9ca3af' }} />
          </div>
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Delivered</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>Estimated 3-7 business days</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <Link to="/store/track-order" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={20} style={{ color: '#4f46e5' }} />
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>Track Your Order</span>
          </div>
          <ChevronRight size={18} style={{ color: '#9ca3af' }} />
        </Link>
        <Link to="/store/account" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={20} style={{ color: '#4f46e5' }} />
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>View My Orders</span>
          </div>
          <ChevronRight size={18} style={{ color: '#9ca3af' }} />
        </Link>
        <Link to="/store/returns" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RotateCcw size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>Return an Item</span>
          </div>
          <ChevronRight size={18} style={{ color: '#9ca3af' }} />
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>
          <Printer size={16} /> Print
        </button>
        <Link to="/store" style={{ display: 'inline-block', padding: '12px 28px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
