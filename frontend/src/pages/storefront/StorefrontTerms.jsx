import React from 'react';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontTerms() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="Terms & Conditions" description="Our terms and conditions of service" url={window.location.href} />
      <StorefrontBreadcrumbs items={[{ label: 'Terms & Conditions' }]} />
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '28px', letterSpacing: '-0.5px' }}>Terms &amp; Conditions</h1>
      <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#4b5563' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>1. Acceptance of Terms</h2>
        <p>By accessing and using our online store, you accept and agree to be bound by these terms and conditions. If you do not agree, please do not use our services.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>2. Products &amp; Pricing</h2>
        <p>All products are subject to availability. Prices are listed in the local currency and may change without notice. We reserve the right to refuse or cancel any order at our discretion.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>3. Orders &amp; Payment</h2>
        <p>When you place an order, you receive an order confirmation email. Payment must be received before we process your order. We accept various payment methods as displayed at checkout.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>4. Shipping &amp; Delivery</h2>
        <p>We strive to deliver products within the estimated timeframe. Delivery times may vary based on location and product availability. Risk of loss passes to you upon delivery.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>5. Returns &amp; Refunds</h2>
        <p>We accept returns within 14 days of delivery for unused items in original packaging. Refunds are processed to the original payment method within 7-14 business days.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>6. Limitation of Liability</h2>
        <p>We are not liable for indirect, incidental, or consequential damages arising from the use of our products or services.</p>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '10px', color: '#111', letterSpacing: '-0.2px' }}>7. Governing Law</h2>
        <p>These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes shall be resolved in the courts of Saudi Arabia.</p>

        <p style={{ marginTop: '36px', fontSize: '13px', color: '#9ca3af' }}>Last updated: {new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}
