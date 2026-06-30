import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Eye, Heart, ShoppingCart, Star, Check } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import { useRecentlyViewed } from '../../store/recentlyViewed';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';

export default function StorefrontHome() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const { items: recentItems } = useRecentlyViewed();

  useEffect(() => {
    Promise.all([
      storeApi.get('/info'),
      storeApi.get('/products?limit=12&sort=popular'),
    ]).then(([infoRes, prodRes]) => {
      setStoreInfo(infoRes.data);
      setProducts(prodRes.data.products);
      const cats = [...new Set(prodRes.data.products.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const storeName = storeInfo?.storeName || 'Store';
  const seoTitle = storeInfo?.seo?.metaTitle || `${storeName} — Online Store`;
  const seoDesc = storeInfo?.seo?.metaDescription || `Shop at ${storeName}`;
  const seoImage = storeInfo?.seo?.ogImage || '';

  const theme = storeInfo?.theme || {};
  const colors = theme.colors || {};
  const c = (key, fallback) => colors[key] || fallback;
  const sections = theme.homepage?.sections || [];
  const currency = storeInfo?.currency || 'SAR';

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('loading');
    try {
      await storeApi.post('/newsletter/subscribe', { email: newsletterEmail });
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  const renderSection = (section) => {
    if (!section.enabled) return null;
    const s = section.settings || {};
    switch (section.type) {
      case 'hero':
        return (
          <div key={section.id} style={{
            background: s.imageUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${s.imageUrl}) center/cover` : `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')})`,
            padding: '80px 24px', textAlign: 'center', borderRadius: '24px', marginBottom: '40px',
            position: 'relative', overflow: 'hidden',
            boxShadow: s.imageUrl ? '0 20px 60px -15px rgba(0,0,0,0.3)' : '0 20px 60px -15px rgba(79,70,229,0.3)',
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff', fontSize: '36px', margin: '0 0 12px', fontWeight: 800, letterSpacing: '-0.5px', textShadow: s.imageUrl ? '0 2px 12px rgba(0,0,0,0.3)' : 'none' }}>{s.title || 'Welcome to our store'}</h2>
              <p style={{ color: '#fff', opacity: 0.95, margin: '0 0 28px', fontSize: '17px', textShadow: s.imageUrl ? '0 1px 8px rgba(0,0,0,0.3)' : 'none' }}>{s.subtitle || ''}</p>
              <Link to={s.buttonLink || '/store/products'} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#fff', color: c('primary', '#4f46e5'),
                padding: '14px 32px', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '16px',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
              >
                {s.buttonText || 'Shop Now'} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        );
      case 'product-carousel':
        return (
          <div key={section.id} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: c('text', '#111'), letterSpacing: '-0.3px' }}>{s.title || 'Products'}</h3>
              <Link to="/store/products" style={{ color: c('primary', '#4f46e5'), textDecoration: 'none', fontSize: '14px', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>View all →</Link>
            </div>
            <div className="sf-grid">
              {products.slice(0, s.limit || 8).map(p => (
                <ProductCard key={p._id} product={p} currency={currency} colors={colors} onQuickView={() => setQuickViewProduct(p)} />
              ))}
            </div>
          </div>
        );
      case 'flash-sale':
        return <FlashSaleSection key={section.id} settings={s} products={products} currency={currency} colors={colors} onQuickView={setQuickViewProduct} />;
      case 'category-grid':
        return (
          <div key={section.id} style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', color: c('text', '#111'), letterSpacing: '-0.3px' }}>{s.title || 'Categories'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columns || 4}, 1fr)`, gap: '16px' }}>
              {(categories.length > 0 ? categories.slice(0, s.columns || 4) : ['Category 1', 'Category 2', 'Category 3', 'Category 4']).map((cat, i) => (
                <Link key={i} to={`/store/products?category=${encodeURIComponent(cat)}`} style={{
                  background: `linear-gradient(135deg, ${c('surface', '#f9fafb')}, #fff)`, border: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  borderRadius: '16px', padding: '32px 24px', textAlign: 'center', textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = c('primary', '#4f46e5') + '40'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = c('borderColor', '#e5e7eb'); }}
                >
                  <p style={{ fontWeight: 700, color: c('text', '#111'), margin: 0, fontSize: '15px' }}>{cat}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      case 'newsletter':
        return (
          <form key={section.id} onSubmit={handleNewsletterSubmit} style={{
            background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')})`, padding: '48px 24px', textAlign: 'center',
            borderRadius: '24px', marginBottom: '40px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px -15px rgba(79,70,229,0.3)',
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ color: '#fff', fontSize: '26px', margin: '0 0 8px', fontWeight: 800 }}>{s.title || 'Subscribe'}</h3>
              <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 24px', fontSize: '15px' }}>{s.subtitle || 'Get updates on new products'}</p>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
                <input placeholder="Email address" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} type="email" required style={{ flex: 1, padding: '14px 18px', border: 'none', borderRadius: '12px', fontSize: '15px', outline: 'none' }} />
                <button type="submit" disabled={newsletterStatus === 'loading'} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>{newsletterStatus === 'loading' ? '...' : 'Subscribe'}</button>
              </div>
              {newsletterStatus === 'success' && <p style={{ color: '#fff', marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>✓ Subscribed! Thank you.</p>}
              {newsletterStatus === 'error' && <p style={{ color: '#fecaca', marginTop: '12px', fontSize: '14px' }}>Failed to subscribe. Please try again.</p>}
            </div>
          </form>
        );
      case 'rich-text':
        return (
          <div key={section.id} style={{ maxWidth: '800px', margin: '0 auto 32px', padding: '16px' }}>
            {s.title && <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: c('text', '#111') }}>{s.title}</h3>}
            <div style={{ color: c('textMuted', '#6b7280'), fontSize: '15px', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: s.content || '' }} />
          </div>
        );
      case 'image-banner':
        return (
          <div key={section.id} style={{ marginBottom: '32px', borderRadius: '12px', overflow: 'hidden' }}>
            {s.imageUrl && <img src={s.imageUrl} alt={s.altText || ''} style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />}
          </div>
        );
      case 'testimonial':
        return (
          <div key={section.id} style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', color: c('text', '#111'), letterSpacing: '-0.3px' }}>{s.title || 'Testimonials'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {(s.items || []).map((item, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                >
                  <div style={{ fontSize: '28px', color: c('primary', '#4f46e5'), lineHeight: 1, marginBottom: '8px' }}>“</div>
                  <p style={{ color: c('text', '#111'), fontSize: '15px', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.6 }}>{item.text || ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>{(item.author || 'C')[0]}</div>
                    <p style={{ color: c('textMuted', '#6b7280'), fontSize: '14px', fontWeight: 600, margin: 0 }}>— {item.author || 'Customer'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'faq':
        return (
          <div key={section.id} style={{ maxWidth: '800px', margin: '0 auto 32px', padding: '16px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: c('text', '#111') }}>{s.title || 'FAQ'}</h3>
            {(s.items || []).map((item, i) => (
              <details key={i} style={{ borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`, padding: '12px 0' }}>
                <summary style={{ fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', color: c('text', '#111') }}>{item.question || ''}</summary>
                <p style={{ color: c('textMuted', '#6b7280'), fontSize: '14px', margin: '8px 0 0', lineHeight: 1.6 }}>{item.answer || ''}</p>
              </details>
            ))}
          </div>
        );
      case 'spacer':
        return <div key={section.id} style={{ height: `${s.height || 40}px` }} />;
      case 'custom-html':
        return <div key={section.id} style={{ marginBottom: '32px' }} dangerouslySetInnerHTML={{ __html: s.html || '' }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo title={seoTitle} description={seoDesc} image={seoImage} url={window.location.href} siteName={storeName} />
      <style>{`
        .sf-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .sf-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
        @media (min-width: 1024px) { .sf-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; } }
        .sf-product-card:hover { transform: translateY(-8px); box-shadow: 0 18px 40px rgba(0,0,0,0.12); border-color: var(--sf-primary, #4f46e5) !important; }
        .sf-product-card:hover .sf-card-img { transform: scale(1.08); }
        .sf-card-actions { opacity: 0; transform: translateX(8px); transition: opacity 0.3s ease, transform 0.3s ease; pointer-events: none; }
        .sf-product-card:hover .sf-card-actions { opacity: 1; transform: translateX(0); pointer-events: auto; }
        .sf-card-cart { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.35s ease, opacity 0.3s ease, padding 0.35s ease; padding-top: 0 !important; padding-bottom: 0 !important; }
        .sf-product-card:hover .sf-card-cart { max-height: 80px; opacity: 1; padding-bottom: 16px !important; }
        @media (hover: none) { .sf-card-actions { opacity: 1; transform: none; pointer-events: auto; } .sf-card-cart { max-height: 80px; opacity: 1; padding-bottom: 16px !important; } }
      `}</style>
      {sections.length > 0 ? sections.map(renderSection) : (
        // Fallback if no theme configured
        <>
          <div style={{ background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')})`, padding: '80px 24px', textAlign: 'center', borderRadius: '24px', marginBottom: '40px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px -15px rgba(79,70,229,0.3)' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff', fontSize: '36px', margin: '0 0 12px', fontWeight: 800, letterSpacing: '-0.5px' }}>{storeInfo?.storeName || 'Welcome'}</h2>
              <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 28px', fontSize: '17px' }}>Discover amazing products at great prices</p>
              <Link to="/store/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: c('primary', '#4f46e5'), padding: '14px 32px', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontSize: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>Shop Now <ArrowRight size={18} /></Link>
            </div>
          </div>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.4px' }}>Featured Products</h3>
            <p style={{ color: c('textMuted', '#6b7280'), fontSize: '14px', margin: '0 0 24px' }}>Handpicked favourites just for you</p>
            <div className="sf-grid">
              {products.map(p => <ProductCard key={p._id} product={p} currency={currency} colors={colors} onQuickView={() => setQuickViewProduct(p)} />)}
            </div>
          </div>
        </>
      )}

      {/* Recently viewed products */}
      {recentItems.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>Recently Viewed</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px' }}>
            {recentItems.slice(0, 6).map(item => (
              <Link key={item.productId} to={`/store/products/${item.slug}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                  {item.image ? <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} /> : null}
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111' }}>{item.title}</p>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: '#059669', margin: 0 }}>{item.price} {currency}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick view modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} currency={currency} />
      )}
    </div>
  );
}

function FlashSaleSection({ settings, products, currency, colors, onQuickView }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const c = (key, fallback) => colors[key] || fallback;

  useEffect(() => {
    if (!settings.endDate) return;
    const update = () => {
      const diff = new Date(settings.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [settings.endDate]);

  const isExpired = !settings.endDate || new Date(settings.endDate).getTime() <= Date.now();
  if (isExpired) return null;

  const discountPercent = settings.discountPercent || 20;
  const limit = settings.limit || 4;
  let saleProducts = products;
  if (settings.categoryFilter) {
    saleProducts = saleProducts.filter(p => p.category === settings.categoryFilter);
  }
  saleProducts = saleProducts.slice(0, limit);

  const pad = (n) => String(n).padStart(2, '0');
  const timeBoxes = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div key={settings.id} style={{
      marginBottom: '40px',
      background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')})`,
      borderRadius: '16px', padding: '28px 20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px' }}>{settings.title || 'Flash Sale'}</h3>
        <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 16px', fontSize: '15px' }}>{settings.subtitle || 'Limited time offer!'}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {timeBoxes.map((tb, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 14px', minWidth: '56px',
            }}>
              <p style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{pad(tb.value)}</p>
              <p style={{ color: '#fff', opacity: 0.7, fontSize: '10px', margin: 0 }}>{tb.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {saleProducts.map(p => {
          const slug = p.seo?.slug || p._id;
          const salePrice = Math.round(p.basePrice * (1 - discountPercent / 100) * 100) / 100;
          return (
            <div key={p._id} style={{
              background: '#fff', borderRadius: '10px', overflow: 'hidden', position: 'relative',
            }}>
              <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ aspectRatio: '1', background: '#f3f4f6', overflow: 'hidden' }}>
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '11px' }}>No image</div>
                  )}
                </div>
                <div style={{ position: 'absolute', top: '6px', left: '6px', background: c('salePriceColor', '#dc2626'), color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px' }}>
                  -{discountPercent}%
                </div>
                <div style={{ padding: '10px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{p.basePrice} {currency}</span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: c('salePriceColor', '#dc2626'), margin: 0 }}>{salePrice} {currency}</p>
                </div>
              </Link>
              {onQuickView && (
                <button onClick={(e) => { e.preventDefault(); onQuickView(p); }} style={{
                  position: 'absolute', top: '6px', right: '6px', width: '30px', height: '30px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <Eye size={14} color={c('primary', '#4f46e5')} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, currency, colors, onQuickView }) {
  const c = (key, fallback) => colors[key] || fallback;
  const slug = product.seo?.slug || product._id;
  const hasSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wished = isInWishlist(product._id);
  const [added, setAdded] = useState(false);
  const outOfStock = product.inventory?.trackInventory && (product.inventory?.quantity ?? 0) <= 0;
  const rating = product.rating?.average || product.reviewStats?.average || 0;
  const reviewCount = product.rating?.count || product.reviewStats?.count || 0;
  const primary = c('primary', '#4f46e5');

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="sf-product-card" style={{
      background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`,
      borderRadius: '18px', overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column',
      position: 'relative', transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%',
      ['--sf-primary']: primary,
    }}>
      <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="sf-card-image" style={{ aspectRatio: '1', background: c('surface', '#f3f4f6'), overflow: 'hidden', position: 'relative' }}>
          {product.images?.[0]?.url ? (
            <img className="sf-card-img" src={product.images[0].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#9ca3af'), fontSize: '12px' }}>No image</div>
          )}
          {/* Badges */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {hasSale && (
              <span style={{ background: c('salePriceColor', '#dc2626'), color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', boxShadow: '0 2px 8px rgba(220,38,38,0.35)' }}>
                -{Math.round((1 - product.basePrice / product.compareAtPrice) * 100)}%
              </span>
            )}
            {outOfStock && (
              <span style={{ background: '#374151', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>Sold Out</span>
            )}
          </div>
        </div>
        <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: '14.5px', color: c('text', '#111'), margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>{product.title}</p>
          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={13} style={{ color: n <= Math.round(rating) ? '#f59e0b' : '#e5e7eb', fill: n <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }} />
              ))}
              {reviewCount > 0 && <span style={{ fontSize: '11px', color: c('textMuted', '#9ca3af'), marginLeft: '3px' }}>({reviewCount})</span>}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: c('priceColor', '#059669') }}>{product.basePrice} {currency}</span>
            {hasSale && (
              <span style={{ fontSize: '13px', color: c('textMuted', '#9ca3af'), textDecoration: 'line-through' }}>{product.compareAtPrice} {currency}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Hover action buttons (top-right) */}
      <div className="sf-card-actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={(e) => { e.preventDefault(); toggleWishlist(product); }} title="Add to wishlist" style={{
          width: '38px', height: '38px', borderRadius: '50%', background: wished ? c('salePriceColor', '#dc2626') : 'rgba(255,255,255,0.96)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', transition: 'transform 0.2s, background 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Heart size={16} style={{ color: wished ? '#fff' : '#374151', fill: wished ? '#fff' : 'none' }} />
        </button>
        {onQuickView && (
          <button onClick={(e) => { e.preventDefault(); onQuickView(); }} title="Quick view" style={{
            width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.96)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', transition: 'transform 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <Eye size={16} color={primary} />
          </button>
        )}
      </div>

      {/* Slide-up Add to Cart */}
      <div className="sf-card-cart" style={{ padding: '0 16px 16px' }}>
        <button onClick={handleAdd} disabled={outOfStock} style={{
          width: '100%', padding: '11px', borderRadius: '12px', border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
          background: added ? '#059669' : primary, color: '#fff', fontWeight: 700, fontSize: '13.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', opacity: outOfStock ? 0.5 : 1, transition: 'background 0.2s',
        }}>
          {added ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> {outOfStock ? 'Sold Out' : 'Add to Cart'}</>}
        </button>
      </div>
    </div>
  );
}
