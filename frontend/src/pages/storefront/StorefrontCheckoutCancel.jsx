import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function StorefrontCheckoutCancel() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
      <XCircle size={72} style={{ color: '#dc2626', margin: '0 auto 20px' }} />
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Payment Cancelled</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px' }}>Your payment was cancelled and no charges were made.</p>
      {orderNumber && (
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
          Order #{orderNumber} — you can retry checkout anytime.
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Link to="/store/checkout" style={{ display: 'inline-block', padding: '12px 28px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Retry Checkout
        </Link>
        <Link to="/store" style={{ display: 'inline-block', padding: '12px 28px', background: '#f3f4f6', color: '#374151', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
