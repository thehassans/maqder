import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function StorefrontCheckoutCancel() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <XCircle size={48} style={{ color: '#dc2626' }} />
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Payment Cancelled</h1>
      <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '15px' }}>Your payment was cancelled and no charges were made.</p>
      {orderNumber && (
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
          Order #{orderNumber} — you can retry checkout anytime.
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Link to="/store/checkout" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', boxShadow: '0 4px 14px rgba(79,70,229,0.25)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)'; }}>
          Retry Checkout
        </Link>
        <Link to="/store" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: '#f3f4f6', color: '#374151', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
