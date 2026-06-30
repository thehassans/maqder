import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';
import { useI18n } from '../../store/storefrontI18n';

const STORAGE_KEY = 'maqder_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

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
      background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: '#fff', padding: '18px 24px',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
    }}>
      <Cookie size={24} style={{ color: '#fbbf24', flexShrink: 0 }} />
      <p style={{ flex: 1, fontSize: '14px', margin: 0, color: '#d1d5db', minWidth: '200px' }}>
        {t('cookieText')}{' '}
        <Link to="/store/privacy" style={{ color: '#818cf8', textDecoration: 'underline' }}>{t('privacyPolicy')}</Link>.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={handleDecline} style={{
          padding: '10px 20px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
        }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#d1d5db'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9ca3af'; }}>
          {t('decline')}
        </button>
        <button onClick={handleAccept} style={{
          padding: '10px 24px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
        }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(79,70,229,0.3)'; }}>
          {t('accept')}
        </button>
        <button onClick={handleDecline} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
