import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';

const STORAGE_KEY = 'maqder_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 250,
      background: '#111827', color: '#fff', padding: '16px 20px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
    }}>
      <Cookie size={24} style={{ color: '#fbbf24', flexShrink: 0 }} />
      <p style={{ flex: 1, fontSize: '14px', margin: 0, color: '#d1d5db', minWidth: '200px' }}>
        We use cookies to improve your experience, analyze traffic, and serve relevant content.
        By clicking "Accept", you agree to our use of cookies. See our{' '}
        <Link to="/store/privacy" style={{ color: '#818cf8', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={handleDecline} style={{
          padding: '8px 16px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
        }}>
          Decline
        </button>
        <button onClick={handleAccept} style={{
          padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
        }}>
          Accept
        </button>
        <button onClick={handleDecline} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
