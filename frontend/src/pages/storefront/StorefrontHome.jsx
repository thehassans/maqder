import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Eye } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import { useRecentlyViewed } from '../../store/recentlyViewed';

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
            background: s.imageUrl ? `url(${s.imageUrl}) center/cover` : c('primary', '#4f46e5'),
            padding: '60px 20px', textAlign: 'center', borderRadius: '12px', marginBottom: '32px',
          }}>
            <h2 style={{ color: '#fff', fontSize: '32px', margin: '0 0 8px', fontWeight: 'bold' }}>{s.title || 'Welcome to our store'}</h2>
            <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 20px', fontSize: '16px' }}>{s.subtitle || ''}</p>
            <Link to={s.buttonLink || '/store/products'} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: c('buttonBg', '#4f46e5'), color: c('buttonText', '#fff'),
              padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold',
            }}>
              {s.buttonText || 'Shop Now'} <ArrowRight size={16} />
            </Link>
          </div>
        );
      case 'product-carousel':
        return (
          <div key={section.id} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: c('text', '#111') }}>{s.title || 'Products'}</h3>
              <Link to="/store/products" style={{ color: c('primary', '#4f46e5'), textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
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
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: c('text', '#111') }}>{s.title || 'Categories'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columns || 4}, 1fr)`, gap: '16px' }}>
              {(categories.length > 0 ? categories.slice(0, s.columns || 4) : ['Category 1', 'Category 2', 'Category 3', 'Category 4']).map((cat, i) => (
                <Link key={i} to={`/store/products?category=${encodeURIComponent(cat)}`} style={{
                  background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  borderRadius: '12px', padding: '24px', textAlign: 'center', textDecoration: 'none',
                }}>
                  <p style={{ fontWeight: 'bold', color: c('text', '#111'), margin: 0 }}>{cat}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      case 'newsletter':
        return (
          <form key={section.id} onSubmit={handleNewsletterSubmit} style={{
            background: c('primary', '#4f46e5'), padding: '40px 20px', textAlign: 'center',
            borderRadius: '12px', marginBottom: '32px',
          }}>
            <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 8px' }}>{s.title || 'Subscribe'}</h3>
            <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 16px' }}>{s.subtitle || 'Get updates on new products'}</p>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              <input placeholder="Email address" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} type="email" required style={{ flex: 1, padding: '10px 14px', border: 'none', borderRadius: '8px', fontSize: '14px' }} />
              <button type="submit" disabled={newsletterStatus === 'loading'} style={{ background: c('buttonBg', '#4f46e5'), color: c('buttonText', '#fff'), border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{newsletterStatus === 'loading' ? '...' : 'Subscribe'}</button>
            </div>
            {newsletterStatus === 'success' && <p style={{ color: '#fff', marginTop: '8px', fontSize: '14px' }}>✓ Subscribed! Thank you.</p>}
            {newsletterStatus === 'error' && <p style={{ color: '#fecaca', marginTop: '8px', fontSize: '14px' }}>Failed to subscribe. Please try again.</p>}
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
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: c('text', '#111') }}>{s.title || 'Testimonials'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {(s.items || []).map((item, i) => (
                <div key={i} style={{ background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '12px', padding: '20px' }}>
                  <p style={{ color: c('text', '#111'), fontSize: '15px', fontStyle: 'italic', margin: '0 0 12px' }}>"{item.text || ''}"</p>
                  <p style={{ color: c('textMuted', '#6b7280'), fontSize: '14px', fontWeight: 'bold', margin: 0 }}>— {item.author || 'Customer'}</p>
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
      {sections.length > 0 ? sections.map(renderSection) : (
        // Fallback if no theme configured
        <>
          <div style={{ background: c('primary', '#4f46e5'), padding: '60px 20px', textAlign: 'center', borderRadius: '12px', marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', fontSize: '32px', margin: '0 0 8px' }}>{storeInfo?.storeName || 'Welcome'}</h2>
            <Link to="/store/products" style={{ display: 'inline-block', background: '#fff', color: c('primary', '#4f46e5'), padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Shop Now</Link>
          </div>
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>Featured Products</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {products.map(p => <ProductCard key={p._id} product={p} currency={currency} colors={colors} onQuickView={() => setQuickViewProduct(p)} />)}
            </div>
          </div>
        </>
      )}

      {/* Recently viewed products */}
      {recentItems.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>Recently Viewed</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {recentItems.slice(0, 6).map(item => (
              <Link key={item.productId} to={`/store/products/${item.slug}`} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', textDecoration: 'none' }}>
                <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                  {item.image ? <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <div style={{ padding: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111' }}>{item.title}</p>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{item.price} {currency}</p>
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
  return (
    <div style={{
      background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`,
      borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', display: 'block',
      position: 'relative',
    }}>
      <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ aspectRatio: '1', background: c('borderColor', '#e5e7eb'), overflow: 'hidden' }}>
          {product.images?.[0]?.url ? (
            <img src={product.images[0].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#6b7280'), fontSize: '12px' }}>No image</div>
          )}
        </div>
        <div style={{ padding: '12px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '14px', color: c('text', '#111'), margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span style={{ fontSize: '12px', color: c('salePriceColor', '#dc2626'), textDecoration: 'line-through', marginRight: '6px' }}>{product.compareAtPrice} {currency}</span>
          )}
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: c('priceColor', '#059669'), margin: 0 }}>{product.basePrice} {currency}</p>
        </div>
      </Link>
      {onQuickView && (
        <button onClick={(e) => { e.preventDefault(); onQuickView(); }} style={{
          position: 'absolute', top: '8px', right: '8px', width: '34px', height: '34px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <Eye size={16} color={c('primary', '#4f46e5')} />
        </button>
      )}
    </div>
  );
}
