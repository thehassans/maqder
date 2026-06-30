import React from 'react';
import { Truck, Clock, MapPin, Package, CreditCard, RotateCcw } from 'lucide-react';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontShippingPolicy() {
  const sections = [
    {
      icon: MapPin,
      title: 'Where We Ship',
      content: 'We currently ship to all cities and regions within Saudi Arabia. We are working on expanding our shipping to other GCC countries in the near future.',
    },
    {
      icon: Clock,
      title: 'Processing Time',
      content: 'Orders are processed within 1-2 business days after payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day.',
    },
    {
      icon: Truck,
      title: 'Delivery Times',
      content: 'Standard delivery takes 2-5 business days depending on your location. Major cities typically receive orders within 2-3 days, while remote areas may take 4-5 days.',
    },
    {
      icon: Package,
      title: 'Shipping Costs',
      content: 'Shipping costs are calculated at checkout based on your location and order weight. Orders above 200 SAR qualify for free standard shipping within Saudi Arabia.',
    },
    {
      icon: CreditCard,
      title: 'Cash on Delivery',
      content: 'Cash on Delivery (COD) is available for most locations within Saudi Arabia. A small COD fee may apply. Please have the exact amount ready when your order arrives.',
    },
    {
      icon: RotateCcw,
      title: 'Returns & Exchanges',
      content: 'You can return or exchange items within 7 days of delivery. Products must be in their original condition and packaging. Please visit our Returns & Refunds page to initiate a return.',
    },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Shipping Policy" description="Our shipping and delivery policy" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Shipping Policy' }]} />

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Shipping Policy</h1>
      <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '32px' }}>Everything you need to know about our shipping and delivery.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: '#4f46e5' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{s.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px', padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
          <strong>Note:</strong> Delivery times may be affected during peak seasons, public holidays, or due to unforeseen circumstances. We will keep you informed of any significant delays.
        </p>
      </div>

      <p style={{ marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>Last updated: {new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  );
}
