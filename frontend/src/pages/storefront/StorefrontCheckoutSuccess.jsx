import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Package, Truck } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';

export default function StorefrontCheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    // Try to fetch order info from public API
    storeApi.get('/info').then(() => {
      // We don't have a public order lookup, so just show success with order number
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fire Purchase pixel event
    firePixelEvent('Purchase', {
      content_type: 'product',
      value: 0, // unknown at this point
      currency: 'SAR',
    });
  }, [orderNumber]);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <CheckCircle size={72} style={{ color: '#059669', margin: '0 auto 20px' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Thank You!</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>Your order has been placed successfully.</p>
      {orderNumber && (
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '32px' }}>
          Order #{orderNumber}
        </p>
      )}
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Package size={20} style={{ color: '#4f46e5' }} />
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Order Confirmed</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>We'll process your order shortly</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Truck size={20} style={{ color: '#6b7280' }} />
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Shipping Updates</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>You'll receive updates as your order ships</p>
          </div>
        </div>
      </div>
      <Link to="/store" style={{ display: 'inline-block', padding: '12px 28px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
        Continue Shopping
      </Link>
    </div>
  );
}
