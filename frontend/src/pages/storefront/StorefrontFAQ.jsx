import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import { Link } from 'react-router-dom';

const DEFAULT_FAQS = [
  {
    question: 'How long does shipping take?',
    answer: 'Shipping typically takes 2-5 business days within Saudi Arabia. You will receive a tracking number once your order is shipped.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy for most items. Products must be in their original condition and packaging. Please visit our Returns & Refunds page to initiate a return.',
  },
  {
    question: 'How can I track my order?',
    answer: 'You can track your order by visiting our Track Order page and entering your order number along with your phone number or email.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards (Mada, Visa, Mastercard), Apple Pay, and cash on delivery (COD) for most locations.',
  },
  {
    question: 'Do you offer free shipping?',
    answer: 'Free shipping is available on orders above a certain threshold. The threshold is displayed at checkout when applicable.',
  },
  {
    question: 'Can I cancel or modify my order?',
    answer: 'Orders can be cancelled or modified within 1 hour of placement. Please contact us as soon as possible if you need to make changes.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Currently, we only ship within Saudi Arabia. We are working on expanding to other countries in the future.',
  },
  {
    question: 'How do I use a gift card?',
    answer: 'Enter your gift card code at checkout in the gift card field. The balance will be deducted from your order total.',
  },
];

export default function StorefrontFAQ() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const faqs = storeInfo?.theme?.faqItems || DEFAULT_FAQS;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <StorefrontSeo title="FAQ — Frequently Asked Questions" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'FAQ' }]} />

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <HelpCircle size={32} style={{ color: '#4f46e5' }} />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Frequently Asked Questions</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Find answers to common questions about orders, shipping, returns, and more.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${openIndex === i ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#111', flex: 1 }}>{faq.question}</span>
              <ChevronDown size={20} style={{ color: '#6b7280', transition: 'transform 0.2s', transform: openIndex === i ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
            </button>
            {openIndex === i && (
              <div style={{ padding: '0 20px 16px', fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>Still have questions?</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>Our support team is here to help.</p>
        <Link to="/store/contact" style={{ display: 'inline-block', padding: '10px 24px', background: '#4f46e5', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          Contact Us
        </Link>
      </div>
    </div>
  );
}
