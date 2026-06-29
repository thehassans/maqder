import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Star } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import QuickViewModal from '../../components/storefront/QuickViewModal';

export default function StorefrontProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storeInfo, setStoreInfo] = useState(null);
  const [data, setData] = useState({ products: [], total: 0, totalPages: 0, categories: [] });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewStats, setReviewStats] = useState({});

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') || '';

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page: String(page), limit: '24' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', inStock);
    storeApi.get(`/products?${params}`)
      .then(res => { setData(res.data); setAllProducts(res.data.products); fetchReviewStats(res.data.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort, page, minPrice, maxPrice, inStock]);

  const fetchReviewStats = async (products) => {
    if (!products?.length) return;
    const ids = products.map(p => p._id).join(',');
    try {
      const res = await storeApi.get(`/review-stats?productIds=${ids}`);
      setReviewStats(res.data);
    } catch {}
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const loadMore = async () => {
    if (page >= data.totalPages) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, page: String(page + 1), limit: '24' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (inStock) params.set('inStock', inStock);
      const res = await storeApi.get(`/products?${params}`);
      setAllProducts(prev => [...prev, ...(res.data.products || [])]);
      setData(prev => ({ ...prev, products: [...allProducts, ...(res.data.products || [])], total: res.data.total, totalPages: res.data.totalPages }));
      updateParam('page', String(page + 1));
    } catch (err) {
      console.error('Failed to load more', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const theme = storeInfo?.theme || {};
  const colors = theme.colors || {};
  const c = (key, fallback) => colors[key] || fallback;
  const currency = storeInfo?.currency || 'SAR';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo
        title={category ? `${category} — ${storeInfo?.storeName || 'Store'}` : search ? `Search: ${search}` : `All Products — ${storeInfo?.storeName || 'Store'}`}
        description={category ? `Browse ${category} at ${storeInfo?.storeName || 'Store'}` : `Shop all products at ${storeInfo?.storeName || 'Store'}`}
        url={window.location.href}
        siteName={storeInfo?.storeName || 'Store'}
      />
      <StorefrontBreadcrumbs items={[{ label: 'Products' }]} />
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 16px', color: c('text', '#111') }}>
          {category || search ? (category || `Search: "${search}"`) : 'All Products'}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); updateParam('search', e.target.elements.q.value); }} style={{ flex: 1, minWidth: '200px', display: 'flex' }}>
            <input name="q" defaultValue={search} placeholder="Search products..." style={{
              flex: 1, padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px 0 0 8px', fontSize: '14px', outline: 'none',
            }} />
            <button type="submit" style={{ padding: '10px 16px', background: c('primary', '#4f46e5'), color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}>
              <Search size={16} />
            </button>
          </form>
          {/* Sort */}
          <select value={sort} onChange={e => updateParam('sort', e.target.value)} style={{
            padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', fontSize: '14px', background: '#fff',
          }}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
          {/* Filters toggle */}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px',
          }}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Category filters + Price range + Availability */}
        {showFilters && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Categories */}
            {data.categories?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => updateParam('category', '')} style={{
                  padding: '6px 14px', borderRadius: '999px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, background: !category ? c('primary', '#4f46e5') : '#fff', color: !category ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px',
                }}>All</button>
                {data.categories.map(cat => cat && (
                  <button key={cat} onClick={() => updateParam('category', cat)} style={{
                    padding: '6px 14px', borderRadius: '999px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, background: category === cat ? c('primary', '#4f46e5') : '#fff', color: category === cat ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px',
                  }}>{cat}</button>
                ))}
              </div>
            )}
            {/* Price range */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: c('text', '#111') }}>Price:</span>
              <input type="number" placeholder="Min" value={minPrice} onChange={e => updateParam('minPrice', e.target.value)} style={{ width: '80px', padding: '6px 10px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', fontSize: '13px' }} />
              <span style={{ color: c('textMuted', '#6b7280') }}>—</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => updateParam('maxPrice', e.target.value)} style={{ width: '80px', padding: '6px 10px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', fontSize: '13px' }} />
              <span style={{ fontSize: '13px', color: c('textMuted', '#6b7280') }}>{currency}</span>
            </div>
            {/* Availability */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: c('text', '#111') }}>Availability:</span>
              <button onClick={() => updateParam('inStock', inStock === 'true' ? '' : 'true')} style={{
                padding: '6px 14px', borderRadius: '999px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, background: inStock === 'true' ? c('primary', '#4f46e5') : '#fff', color: inStock === 'true' ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px',
              }}>In Stock Only</button>
            </div>
          </div>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : data.products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c('textMuted', '#6b7280') }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>No products found</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '14px', color: c('textMuted', '#6b7280'), marginBottom: '16px' }}>{data.total} products</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {allProducts.map(p => {
              const slug = p.seo?.slug || p._id;
              const images = p.images?.filter(img => img.url) || [];
              const hasMultiple = images.length > 1;
              return (
                <div key={p._id} style={{
                  background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  borderRadius: '12px', overflow: 'hidden', position: 'relative',
                }} className="product-card" onMouseEnter={e => e.currentTarget.querySelector('.card-thumbs')?.style.setProperty('opacity', '1')}
                  onMouseLeave={e => { e.currentTarget.querySelector('.card-thumbs')?.style.setProperty('opacity', '0'); const img = e.currentTarget.querySelector('.card-main-img'); if (img && images[0]) img.src = images[0].url; }}>
                  <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ aspectRatio: '1', background: c('borderColor', '#e5e7eb'), overflow: 'hidden', position: 'relative' }}>
                      {images[0]?.url ? (
                        <img src={images[0].url} alt={p.title} className="card-main-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#6b7280'), fontSize: '12px' }}>No image</div>
                      )}
                      {hasMultiple && (
                        <div className="card-thumbs" style={{
                          position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                          display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s', zIndex: 2,
                        }}>
                          {images.slice(0, 5).map((img, i) => (
                            <div key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); const mainImg = e.currentTarget.closest('.product-card').querySelector('.card-main-img'); if (mainImg) mainImg.src = img.url; }} style={{
                              width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden',
                              border: '2px solid rgba(255,255,255,0.8)', cursor: 'pointer', background: '#fff',
                            }}>
                              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
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
                  {/* Quick view button */}
                  <button onClick={(e) => { e.preventDefault(); setQuickViewProduct(p); }} style={{
                    position: 'absolute', top: '8px', right: '8px', width: '34px', height: '34px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0} className="quick-view-btn">
                    <Eye size={16} color="#4f46e5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Load more + pagination */}
          {data.totalPages > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
              {page < data.totalPages && (
                <button onClick={loadMore} disabled={loadingMore} style={{
                  padding: '12px 32px', border: `1px solid ${c('primary', '#4f46e5')}`, borderRadius: '999px',
                  background: '#fff', color: c('primary', '#4f46e5'), cursor: loadingMore ? 'default' : 'pointer',
                  fontWeight: 'bold', fontSize: '14px', opacity: loadingMore ? 0.6 : 1,
                }}>
                  {loadingMore ? 'Loading...' : 'Load More Products'}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateParam('page', String(Math.max(1, page - 1)))} disabled={page <= 1} style={{
                  padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
                }}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: '14px', padding: '0 12px' }}>Page {page} of {data.totalPages}</span>
                <button onClick={() => updateParam('page', String(Math.min(data.totalPages, page + 1)))} disabled={page >= data.totalPages} style={{
                  padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', background: '#fff', cursor: page >= data.totalPages ? 'default' : 'pointer', opacity: page >= data.totalPages ? 0.5 : 1,
                }}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick view modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} currency={currency} />
      )}
    </div>
  );
}
