import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';

const STORAGE_KEY = 'maqder_abandoned_cart';
const DISMISS_KEY = 'maqder_abandoned_cart_dismissed';
const MIN_ITEMS = 1;
const DELAY_MS = 5000;

export default function AbandonedCartReminder() {
  const { items, cartCount } = useCart();
  const [show, setShow] = useState(false);
  const { t } = useI18n();

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
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '14px 18px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '14px',
      maxWidth: '90vw', width: '400px',
    }} className="md:bottom-6">
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e515, #4f46e508)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ShoppingCart size={22} color="#4f46e5" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>{cartCount} {cartCount !== 1 ? t('itemsInCart') : t('itemInCart')}</p>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{t('dontForgetOrder')}</p>
      </div>
      <Link to="/store/checkout" onClick={handleDismiss} style={{
        padding: '10px 20px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', flexShrink: 0, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(79,70,229,0.2)',
      }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.2)'; }}>
        {t('checkout')}
      </Link>
      <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
        <X size={18} color="#9ca3af" />
      </button>
    </div>
  );
}
