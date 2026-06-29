import React from 'react';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontPrivacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo title="Privacy Policy" description="Our privacy policy and data protection practices" url={window.location.href} />
      <StorefrontBreadcrumbs items={[{ label: 'Privacy Policy' }]} />
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Privacy Policy</h1>
      <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#4b5563' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>1. Information We Collect</h2>
        <p>We collect information you provide when you create an account, place an order, subscribe to our newsletter, or contact us. This includes your name, email address, phone number, shipping address, and payment information.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>2. How We Use Your Information</h2>
        <p>We use your information to process orders, communicate with you about your purchases, send marketing communications (with your consent), improve our services, and comply with legal obligations.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>3. Data Protection (KSA PDPL)</h2>
        <p>In compliance with the Saudi Personal Data Protection Law (PDPL), we ensure that your personal data is processed lawfully, fairly, and transparently. You have the right to access, correct, and request deletion of your personal data.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>4. Cookies</h2>
        <p>We use cookies to improve your browsing experience, analyze traffic, and personalize content. You can control cookie preferences through your browser settings or our cookie consent banner.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>5. Third-Party Services</h2>
        <p>We may use third-party services for payment processing, analytics, and marketing. These providers have their own privacy policies governing the use of your data.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '8px', color: '#111' }}>6. Contact Us</h2>
        <p>If you have questions about this privacy policy, please contact us through the information provided on our website.</p>

        <p style={{ marginTop: '32px', fontSize: '13px', color: '#9ca3af' }}>Last updated: {new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}
