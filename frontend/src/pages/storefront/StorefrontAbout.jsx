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
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Store size={36} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>About {storeName}</h1>
        {storeDesc ? (
          <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>{storeDesc}</p>
        ) : (
          <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
            We are dedicated to bringing you the best products at competitive prices. Our mission is to make online shopping easy, secure, and enjoyable for everyone in Saudi Arabia.
          </p>
        )}
      </div>

      {/* Story */}
      <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '32px', marginBottom: '40px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={22} style={{ color: '#4f46e5' }} /> Our Story
        </h2>
        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.8, marginBottom: '12px' }}>
          {storeName} was founded with a simple goal: to provide high-quality products with exceptional service to customers across Saudi Arabia. What started as a small operation has grown into a trusted online destination for thousands of shoppers.
        </p>
        <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.8 }}>
          We believe that online shopping should be more than just a transaction — it should be an experience. From browsing our carefully curated catalog to receiving your order at your doorstep, we strive to exceed your expectations at every step.
        </p>
      </div>

      {/* Values */}
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>Our Values</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {values.map((v, i) => {
          const Icon = v.icon;
          return (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon size={24} style={{ color: '#4f46e5' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>{v.title}</h3>
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
            <div key={i} style={{ textAlign: 'center', padding: '24px', background: '#4f46e5', borderRadius: '14px', color: '#fff' }}>
              <Icon size={28} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', background: '#f9fafb', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Ready to explore?</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Browse our collection and find something you'll love.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/store/products" style={{ display: 'inline-block', padding: '12px 28px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>Shop Now</Link>
          <Link to="/store/contact" style={{ display: 'inline-block', padding: '12px 28px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
