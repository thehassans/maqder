import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../../store/storefrontCart';

const STORAGE_KEY = 'maqder_abandoned_cart';
const DISMISS_KEY = 'maqder_abandoned_cart_dismissed';
const MIN_ITEMS = 1;
const DELAY_MS = 5000;

export default function AbandonedCartReminder() {
  const { items, cartCount } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (cartCount >= MIN_ITEMS) {
      const timestamp = localStorage.getItem(STORAGE_KEY);
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!timestamp) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), DELAY_MS);
        return () => clearTimeout(timer);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setShow(false);
    }
  }, [cartCount]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  if (!show || cartCount === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '76px', left: '50%', transform: 'translateX(-50%)', zIndex: 140,
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '12px',
      maxWidth: '90vw', width: '400px',
    }} className="md:bottom-6">
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4f46e515', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ShoppingCart size={20} color="#4f46e5" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 2px' }}>You have {cartCount} item{cartCount !== 1 ? 's' : ''} in your cart</p>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Don't forget to complete your order!</p>
      </div>
      <Link to="/store/checkout" onClick={handleDismiss} style={{
        padding: '8px 16px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', flexShrink: 0,
      }}>
        Checkout
      </Link>
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
        <X size={18} color="#9ca3af" />
      </button>
    </div>
  );
}
