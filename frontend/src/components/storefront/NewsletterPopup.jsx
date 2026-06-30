import React, { useState, useEffect } from 'react';
import { X, Mail, Gift } from 'lucide-react';
import storeApi from '../../lib/storeApi';

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [dismissed, setDismissed] = useState(false);

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
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', maxWidth: '440px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <button onClick={handleClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <X size={18} style={{ color: '#6b7280' }} />
        </button>

        <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '32px 28px 24px', textAlign: 'center', color: '#fff' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Gift size={28} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px' }}>Get 10% Off Your First Order!</h2>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>Subscribe to our newsletter for exclusive deals and updates.</p>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Mail size={24} style={{ color: '#059669' }} />
              </div>
              <p style={{ fontWeight: 'bold', fontSize: '16px', color: '#059669', margin: 0 }}>You're subscribed! Check your email for the discount code.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ width: '100%', padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe & Get 10% Off'}
              </button>
              {status === 'error' && <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center', margin: '8px 0 0' }}>Something went wrong. Please try again.</p>}
              <button type="button" onClick={handleClose} style={{ width: '100%', background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', marginTop: '12px' }}>
                No thanks, I'll pay full price
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
