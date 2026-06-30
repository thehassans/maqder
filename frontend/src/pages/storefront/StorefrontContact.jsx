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

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit' };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Contact Us" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Contact Us' }]} />

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Contact Us</h1>
      <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '32px' }}>Have a question? We'd love to hear from you.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} style={{ color: '#4f46e5' }} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Email</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>info@store.com</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={20} style={{ color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Phone</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>+966 50 000 0000</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Address</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Riyadh, Saudi Arabia</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>Hours</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Sat - Thu, 9 AM - 10 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={48} style={{ color: '#059669', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Message Sent!</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>Thank you for reaching out. We'll get back to you soon.</p>
              <button onClick={() => setSuccess(false)} style={{ padding: '10px 24px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input required placeholder="Your name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                <input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle} />
              </div>
              <textarea required placeholder="Your message *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px' }} />
              {error && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px',
                background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.6 : 1,
              }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
