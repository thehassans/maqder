import React, { useState, useEffect } from 'react';
import { X, Mail, Gift } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useI18n } from '../../store/storefrontI18n';

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const { t, isRTL } = useI18n();

  useEffect(() => {
    const dismissed = localStorage.getItem('newsletter_popup_dismissed');
    if (dismissed) return;

    const handler = (e) => {
      if (e.clientY <= 0 && !dismissed) {
        setShow(true);
      }
    };
    document.addEventListener('mouseleave', handler);
    const timer = setTimeout(() => {
      if (!dismissed) setShow(true);
    }, 15000);

    return () => {
      document.removeEventListener('mouseleave', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('newsletter_popup_dismissed', '1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      await storeApi.post('/newsletter', { email: email.trim() });
      setStatus('success');
      setTimeout(handleClose, 2000);
    } catch {
      setStatus('error');
    }
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '24px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: '14px', [isRTL ? 'left' : 'right']: '14px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <X size={18} style={{ color: '#6b7280' }} />
        </button>

        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '36px 28px 28px', textAlign: 'center', color: '#fff' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Gift size={30} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{t('get10Off')}</h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>{t('newsletterPopupSub')}</p>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Mail size={26} style={{ color: '#059669' }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#059669', margin: 0 }}>{t('subscribedCheckEmail')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('enterYourEmail')}
                style={{ width: '100%', padding: '14px 18px', border: '1px solid #e5e7eb', borderRadius: '14px', fontSize: '15px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}
                onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {status === 'loading' ? t('submitting') : t('subscribeGet10')}
              </button>
              {status === 'error' && <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center', margin: '8px 0 0', fontWeight: 600 }}>{t('somethingWrong')}</p>}
              <button type="button" onClick={handleClose} style={{ width: '100%', background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', marginTop: '14px' }}>
                {t('noThanksFullPrice')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
