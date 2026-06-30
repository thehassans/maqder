import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2, Clock, MessageSquare } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontContact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await storeApi.post('/contact', form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Contact Us" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Contact Us' }]} />

      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.5px' }}>Contact Us</h1>
      <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '36px' }}>Have a question? We'd love to hear from you.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={22} style={{ color: '#4f46e5' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Email</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>info@store.com</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={22} style={{ color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Phone</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>+966 50 000 0000</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={22} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Address</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Riyadh, Saudi Arabia</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={22} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>Hours</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Sat - Thu, 9 AM - 10 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          {success ? (
            <div style={{ textAlign: 'center', padding: '48px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={52} style={{ color: '#059669', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.3px' }}>Message Sent!</h2>
              <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '15px' }}>Thank you for reaching out. We'll get back to you soon.</p>
              <button onClick={() => setSuccess(false)} style={{ padding: '12px 28px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input required placeholder="Your name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                <input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle} />
              </div>
              <textarea required placeholder="Your message *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px' }} />
              {error && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px', fontWeight: 600 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
              }} onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
