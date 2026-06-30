import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Truck, ShieldCheck, Award, Users, Sparkles, Store, Loader2 } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontAbout() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const storeName = storeInfo?.name || storeInfo?.ecommerce?.storeName || 'Our Store';
  const storeDesc = storeInfo?.ecommerce?.storeDescription || storeInfo?.description || '';

  const values = [
    { icon: Heart, title: 'Customer First', desc: 'We prioritize your satisfaction above everything else. Every decision we make starts with how it benefits you.' },
    { icon: Award, title: 'Quality Guaranteed', desc: 'We carefully curate our products to ensure they meet the highest standards of quality and craftsmanship.' },
    { icon: Truck, title: 'Fast Delivery', desc: 'We partner with reliable couriers to deliver your orders quickly and safely across Saudi Arabia.' },
    { icon: ShieldCheck, title: 'Secure Shopping', desc: 'Your data is protected with industry-standard encryption. Shop with confidence and peace of mind.' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title={`About Us — ${storeName}`} description={`Learn more about ${storeName}`} />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'About Us' }]} />

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: 'linear-gradient(135deg, #4f46e520, #4f46e510)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Store size={36} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.5px' }}>About {storeName}</h1>
        {storeDesc ? (
          <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>{storeDesc}</p>
        ) : (
          <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
            We are dedicated to bringing you the best products at competitive prices. Our mission is to make online shopping easy, secure, and enjoyable for everyone in Saudi Arabia.
          </p>
        )}
      </div>

      {/* Story */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', marginBottom: '40px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.3px' }}>
          <Sparkles size={24} style={{ color: '#4f46e5' }} /> Our Story
        </h2>
        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.8, marginBottom: '14px' }}>
          {storeName} was founded with a simple goal: to provide high-quality products with exceptional service to customers across Saudi Arabia. What started as a small operation has grown into a trusted online destination for thousands of shoppers.
        </p>
        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.8 }}>
          We believe that online shopping should be more than just a transaction — it should be an experience. From browsing our carefully curated catalog to receiving your order at your doorstep, we strive to exceed your expectations at every step.
        </p>
      </div>

      {/* Values */}
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', textAlign: 'center', letterSpacing: '-0.3px' }}>Our Values</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {values.map((v, i) => {
          const Icon = v.icon;
          return (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '28px', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #4f46e520, #4f46e510)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Icon size={26} style={{ color: '#4f46e5' }} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>{v.title}</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {[
          { icon: Users, value: '10,000+', label: 'Happy Customers' },
          { icon: Award, value: '500+', label: 'Products' },
          { icon: Truck, value: '2-5 days', label: 'Fast Delivery' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ textAlign: 'center', padding: '28px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', borderRadius: '18px', color: '#fff', boxShadow: '0 4px 14px rgba(79,70,229,0.2)' }}>
              <Icon size={30} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: '20px', padding: '36px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.3px' }}>Ready to explore?</h3>
        <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '24px' }}>Browse our collection and find something you'll love.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/store/products" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', boxShadow: '0 4px 14px rgba(79,70,229,0.25)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)'; }}>Shop Now</Link>
          <Link to="/store/contact" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
