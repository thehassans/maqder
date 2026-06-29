import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import storeApi from '../../lib/storeApi';

export default function StorefrontHome() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      storeApi.get('/info'),
      storeApi.get('/products?limit=12&sort=popular'),
    ]).then(([infoRes, prodRes]) => {
      setStoreInfo(infoRes.data);
      setProducts(prodRes.data.products);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const theme = storeInfo?.theme || {};
  const colors = theme.colors || {};
  const c = (key, fallback) => colors[key] || fallback;
  const sections = theme.homepage?.sections || [];
  const currency = storeInfo?.currency || 'SAR';

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
                <ProductCard key={p._id} product={p} currency={currency} colors={colors} />
              ))}
            </div>
          </div>
        );
      case 'category-grid':
        return (
          <div key={section.id} style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: c('text', '#111') }}>{s.title || 'Categories'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columns || 4}, 1fr)`, gap: '16px' }}>
              {['Category 1', 'Category 2', 'Category 3', 'Category 4'].map((cat, i) => (
                <Link key={i} to="/store/products" style={{
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
          <div key={section.id} style={{
            background: c('primary', '#4f46e5'), padding: '40px 20px', textAlign: 'center',
            borderRadius: '12px', marginBottom: '32px',
          }}>
            <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 8px' }}>{s.title || 'Subscribe'}</h3>
            <p style={{ color: '#fff', opacity: 0.9, margin: '0 0 16px' }}>{s.subtitle || 'Get updates on new products'}</p>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              <input placeholder="Email address" style={{ flex: 1, padding: '10px 14px', border: 'none', borderRadius: '8px', fontSize: '14px' }} />
              <button style={{ background: c('buttonBg', '#4f46e5'), color: c('buttonText', '#fff'), border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Subscribe</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
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
              {products.map(p => <ProductCard key={p._id} product={p} currency={currency} colors={colors} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({ product, currency, colors }) {
  const c = (key, fallback) => colors[key] || fallback;
  const slug = product.seo?.slug || product._id;
  return (
    <Link to={`/store/products/${slug}`} style={{
      background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`,
      borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', display: 'block',
      transition: 'transform 0.15s', ':hover': { transform: 'translateY(-2px)' },
    }}>
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
  );
}
