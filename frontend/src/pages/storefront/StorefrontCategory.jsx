import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import QuickViewModal from '../../components/storefront/QuickViewModal';

export default function StorefrontCategory() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [reviewStats, setReviewStats] = useState({});

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    storeApi.get(`/category/${encodeURIComponent(slug)}`)
      .then(res => {
        setData(res.data);
        if (res.data.products?.length) fetchReviewStats(res.data.products);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const fetchReviewStats = async (products) => {
    const ids = products.map(p => p._id).join(',');
    try {
      const res = await storeApi.get(`/review-stats?productIds=${ids}`);
      setReviewStats(res.data);
    } catch {}
  };

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}><p style={{ color: '#6b7280' }}>Loading...</p></div>;
  }

  if (!data) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <StorefrontSeo title="Category Not Found" />
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Category not found</h1>
        <Link to="/store/products" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Browse all products →</Link>
      </div>
    );
  }

  const c = (key, fallback) => storeInfo?.theme?.colors?.[key] || fallback;
  const currency = storeInfo?.currency || 'SAR';
  const categoryName = data.category;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo
        title={`${categoryName} — Buy Online`}
        description={`Shop ${categoryName} online. ${data.total} products available with fast delivery.`}
        url={window.location.href}
      />
      <StorefrontBreadcrumbs items={[
        { label: 'Home', path: '/store' },
        { label: 'Products', path: '/store/products' },
        { label: categoryName },
      ]} />

      {/* Category hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}11, ${c('primary', '#4f46e5')}05)`,
        borderRadius: '16px', padding: '32px 24px', marginBottom: '24px', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: c('text', '#111') }}>{categoryName}</h1>
        <p style={{ color: c('textMuted', '#6b7280'), fontSize: '15px' }}>{data.total} product{data.total !== 1 ? 's' : ''} available</p>
        {data.subCategories?.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
            {data.subCategories.map(sub => (
              <Link key={sub} to={`/store/products?category=${encodeURIComponent(sub)}`}
                style={{ padding: '6px 14px', background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '999px', fontSize: '13px', fontWeight: 'bold', color: c('text', '#111'), textDecoration: 'none' }}>
                {sub}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {data.products.map(p => {
          const slug = p.seo?.slug || p._id;
          return (
            <div key={p._id} style={{ background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
              <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ aspectRatio: '1', background: c('borderColor', '#e5e7eb'), overflow: 'hidden' }}>
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '14px', color: c('text', '#111'), margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  {reviewStats[p._id]?.count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex' }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={12} fill={n <= Math.round(reviewStats[p._id].avgRating) ? '#fbbf24' : 'none'} color={n <= Math.round(reviewStats[p._id].avgRating) ? '#fbbf24' : '#d1d5db'} />
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: c('textMuted', '#6b7280') }}>({reviewStats[p._id].count})</span>
                    </div>
                  )}
                  {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                    <span style={{ fontSize: '12px', color: c('salePriceColor', '#dc2626'), textDecoration: 'line-through', marginRight: '6px' }}>{p.compareAtPrice} {currency}</span>
                  )}
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: c('priceColor', '#059669'), margin: 0 }}>{p.basePrice} {currency}</p>
                </div>
              </Link>
              <button onClick={(e) => { e.preventDefault(); setQuickViewProduct(p); }} style={{
                position: 'absolute', top: '8px', right: '8px', width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Eye size={16} color={c('text', '#111')} />
              </button>
            </div>
          );
        })}
      </div>

      {/* View all link */}
      {data.total > data.products.length && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to={`/store/products?category=${encodeURIComponent(categoryName)}`}
            style={{ display: 'inline-block', padding: '12px 28px', border: `2px solid ${c('primary', '#4f46e5')}`, borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', color: c('primary', '#4f46e5') }}>
            View all {data.total} products →
          </Link>
        </div>
      )}

      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}
    </div>
  );
}
