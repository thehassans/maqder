import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Star, GitCompare, Check, Heart, ShoppingCart } from 'lucide-react';
import SaudiRiyalSymbol from '../../components/storefront/SaudiRiyalSymbol';
import storeApi from '../../lib/storeApi';
import { useCompare } from '../../store/storefrontCompare';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import QuickViewModal from '../../components/storefront/QuickViewModal';
import LiveSearch from '../../components/storefront/LiveSearch';
import { SkeletonGrid } from '../../components/storefront/StorefrontUi';

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
  const { toggleCompare, isInCompare, count: compareCount } = useCompare();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { t, isRTL } = useI18n();

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
      <StorefrontBreadcrumbs items={[{ label: t('products') }]} />
      <style>{`
        .sf-products-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .sf-products-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }
        @media (min-width: 1024px) { .sf-products-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; } }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 20px', color: c('text', '#111'), letterSpacing: '-0.5px' }}>
          {category || search ? (category || `"${search}"`) : t('allProducts')}
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <LiveSearch placeholder={t('search')} colors={colors} isRTL={isRTL} />
          {/* Sort */}
          <select value={sort} onChange={e => updateParam('sort', e.target.value)} style={{
            padding: '12px 16px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '12px', fontSize: '14px', background: '#fff', cursor: 'pointer', outline: 'none',
          }}>
            <option value="newest">{t('newest')}</option>
            <option value="price-low">{t('priceLow')}</option>
            <option value="price-high">{t('priceHigh')}</option>
            <option value="popular">{t('mostPopular')}</option>
          </select>
          {/* Filters toggle */}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding: '12px 16px', border: `1px solid ${showFilters ? c('primary', '#4f46e5') : c('borderColor', '#e5e7eb')}`, borderRadius: '12px', background: showFilters ? c('primary', '#4f46e5') : '#fff', color: showFilters ? '#fff' : c('text', '#111'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
          }}>
            <SlidersHorizontal size={16} /> {t('filters')}
          </button>
        </div>

        {/* Category filters + Price range + Availability */}
        {showFilters && (
          <div style={{ marginTop: '16px', padding: '20px', background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Categories */}
            {data.categories?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: c('text', '#111'), marginInlineEnd: '4px' }}>{t('categories')}:</span>
                <button onClick={() => updateParam('category', '')} style={{
                  padding: '7px 16px', borderRadius: '999px', border: `1px solid ${!category ? c('primary', '#4f46e5') : c('borderColor', '#e5e7eb')}`, background: !category ? c('primary', '#4f46e5') : '#fff', color: !category ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                }}>{t('all')}</button>
                {data.categories.map(cat => cat && (
                  <button key={cat} onClick={() => updateParam('category', cat)} style={{
                    padding: '7px 16px', borderRadius: '999px', border: `1px solid ${category === cat ? c('primary', '#4f46e5') : c('borderColor', '#e5e7eb')}`, background: category === cat ? c('primary', '#4f46e5') : '#fff', color: category === cat ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                  }}>{cat}</button>
                ))}
              </div>
            )}
            {/* Price range */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: c('text', '#111') }}>{t('priceRange')}</span>
              <input type="number" placeholder={t('min')} value={minPrice} onChange={e => updateParam('minPrice', e.target.value)} style={{ width: '90px', padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
              <span style={{ color: c('textMuted', '#6b7280') }}>—</span>
              <input type="number" placeholder={t('max')} value={maxPrice} onChange={e => updateParam('maxPrice', e.target.value)} style={{ width: '90px', padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '13px', outline: 'none' }} />
              <span style={{ fontSize: '13px', color: c('textMuted', '#6b7280'), display: 'inline-flex', alignItems: 'center', gap: '2px' }}><SaudiRiyalSymbol size={10} color={c('textMuted', '#6b7280')} /></span>
            </div>
            {/* Availability */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: c('text', '#111') }}>{t('availability')}</span>
              <button onClick={() => updateParam('inStock', inStock === 'true' ? '' : 'true')} style={{
                padding: '7px 16px', borderRadius: '999px', border: `1px solid ${inStock === 'true' ? c('primary', '#4f46e5') : c('borderColor', '#e5e7eb')}`, background: inStock === 'true' ? c('primary', '#4f46e5') : '#fff', color: inStock === 'true' ? '#fff' : c('text', '#111'), cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
              }}>{t('inStockOnly')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : data.products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: c('textMuted', '#6b7280') }}>
          <Search size={56} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '20px', fontWeight: 700, color: c('text', '#111') }}>{t('noProducts')}</p>
          <p style={{ fontSize: '15px', marginTop: '8px' }}>{t('tryAdjusting')}</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '14px', color: c('textMuted', '#6b7280'), marginBottom: '20px', fontWeight: 500 }}>{data.total} {t('productsCount')}</p>
          <div className="sf-products-grid">
            {allProducts.map(p => {
              const slug = p.seo?.slug || p._id;
              const images = p.images?.filter(img => img.url) || [];
              const hasMultiple = images.length > 1;
              const hasSale = p.compareAtPrice && p.compareAtPrice > p.basePrice;
              return (
                <div key={p._id} style={{
                  background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  borderRadius: '16px', overflow: 'hidden', position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }} className="product-card" onMouseEnter={e => { e.currentTarget.querySelector('.card-thumbs')?.style.setProperty('opacity', '1'); e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = c('primary', '#4f46e5') + '40'; }}
                  onMouseLeave={e => { e.currentTarget.querySelector('.card-thumbs')?.style.setProperty('opacity', '0'); const img = e.currentTarget.querySelector('.card-main-img'); if (img && images[0]) img.src = images[0].url; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = c('borderColor', '#e5e7eb'); }}>
                  <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ aspectRatio: '1', background: c('borderColor', '#e5e7eb'), overflow: 'hidden', position: 'relative' }}>
                      {hasSale && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: c('salePriceColor', '#dc2626'), color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', zIndex: 3, boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                          -{Math.round((1 - p.basePrice / p.compareAtPrice) * 100)}%
                        </div>
                      )}
                      {images[0]?.url ? (
                        <img src={images[0].url} alt={p.title} loading="lazy" className="card-main-img" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#6b7280'), fontSize: '12px' }}>{t('noImage')}</div>
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
                    <div style={{ padding: '14px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: c('text', '#111'), margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                      {reviewStats[p._id]?.count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                          <div style={{ display: 'flex' }}>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={12} fill={n <= Math.round(reviewStats[p._id].avgRating) ? '#fbbf24' : 'none'} color={n <= Math.round(reviewStats[p._id].avgRating) ? '#fbbf24' : '#d1d5db'} />
                            ))}
                          </div>
                          <span style={{ fontSize: '11px', color: c('textMuted', '#6b7280') }}>({reviewStats[p._id].count})</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        {hasSale && (
                          <span style={{ fontSize: '12px', color: c('salePriceColor', '#dc2626'), textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: '2px' }}>{p.compareAtPrice} <SaudiRiyalSymbol size={10} color={c('salePriceColor', '#dc2626')} /></span>
                        )}
                        <p style={{ fontSize: '17px', fontWeight: 800, color: c('priceColor', '#059669'), margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>{p.basePrice} <SaudiRiyalSymbol size={13} color={c('priceColor', '#059669')} /></p>
                      </div>
                    </div>
                  </Link>
                  {/* Quick view button */}
                  <button onClick={(e) => { e.preventDefault(); setQuickViewProduct(p); }} style={{
                    position: 'absolute', top: '10px', right: '10px', width: '36px', height: '36px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'all 0.25s', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                  }} onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.transform = 'scale(1)'; }} className="quick-view-btn">
                    <Eye size={16} color={c('primary', '#4f46e5')} />
                  </button>
                  {/* Wishlist button */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(p); }} className="wishlist-btn"
                    style={{ position: 'absolute', top: '10px', right: '54px', width: '36px', height: '36px', borderRadius: '50%', background: isInWishlist(p._id) ? '#ec4899' : 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', opacity: isInWishlist(p._id) ? 1 : 0, transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = isInWishlist(p._id) ? 1 : 0; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <Heart size={16} color={isInWishlist(p._id) ? '#fff' : '#ec4899'} fill={isInWishlist(p._id) ? '#fff' : 'none'} />
                  </button>
                  {/* Compare button */}
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(p._id); }} className="compare-btn"
                    style={{ position: 'absolute', top: '10px', right: '98px', width: '36px', height: '36px', borderRadius: '50%', background: isInCompare(p._id) ? c('primary', '#4f46e5') : 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', opacity: isInCompare(p._id) ? 1 : 0, transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = isInCompare(p._id) ? 1 : 0; e.currentTarget.style.transform = 'scale(1)'; }}>
                    {isInCompare(p._id) ? <Check size={16} color="#fff" /> : <GitCompare size={16} color={c('primary', '#4f46e5')} />}
                  </button>
                  {/* Add to cart */}
                  <div style={{ padding: '0 14px 14px' }}>
                    <button onClick={(e) => { e.preventDefault(); addItem(p, 1); }} style={{
                      width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: c('primary', '#4f46e5'), color: '#fff', fontWeight: 700, fontSize: '13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'opacity 0.2s',
                    }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <ShoppingCart size={15} /> {t('addToCart')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more + pagination */}
          {data.totalPages > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '48px' }}>
              {page < data.totalPages && (
                <button onClick={loadMore} disabled={loadingMore} style={{
                  padding: '14px 36px', border: `2px solid ${c('primary', '#4f46e5')}`, borderRadius: '999px',
                  background: '#fff', color: c('primary', '#4f46e5'), cursor: loadingMore ? 'default' : 'pointer',
                  fontWeight: 700, fontSize: '15px', opacity: loadingMore ? 0.6 : 1, transition: 'all 0.2s',
                }} onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.background = c('primary', '#4f46e5'); e.currentTarget.style.color = '#fff'; } }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = c('primary', '#4f46e5'); }}>
                  {loadingMore ? '...' : t('viewAll')}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateParam('page', String(Math.max(1, page - 1)))} disabled={page <= 1} style={{
                  padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1, transition: 'all 0.2s',
                }}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: '14px', padding: '0 12px', fontWeight: 600 }}>{t('page')} {page} {t('of')} {data.totalPages}</span>
                <button onClick={() => updateParam('page', String(Math.min(data.totalPages, page + 1)))} disabled={page >= data.totalPages} style={{
                  padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', background: '#fff', cursor: page >= data.totalPages ? 'default' : 'pointer', opacity: page >= data.totalPages ? 0.5 : 1, transition: 'all 0.2s',
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

      {/* Floating compare bar */}
      {compareCount > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCompare size={18} color={c('primary', '#4f46e5')} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{compareCount} {t('productsCount')} {t('compare')}</span>
          </div>
          <Link to="/store/compare" style={{ padding: '10px 24px', background: c('primary', '#4f46e5'), color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {t('compare')}
          </Link>
        </div>
      )}
    </div>
  );
}
