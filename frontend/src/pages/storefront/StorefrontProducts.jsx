import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storeInfo, setStoreInfo] = useState(null);
  const [data, setData] = useState({ products: [], total: 0, totalPages: 0, categories: [] });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page: String(page), limit: '24' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    storeApi.get(`/products?${params}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
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

        {/* Category filters */}
        {showFilters && data.categories?.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            {data.products.map(p => {
              const slug = p.seo?.slug || p._id;
              return (
                <Link key={p._id} to={`/store/products/${slug}`} style={{
                  background: c('surface', '#f9fafb'), border: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  borderRadius: '12px', overflow: 'hidden', textDecoration: 'none',
                }}>
                  <div style={{ aspectRatio: '1', background: c('borderColor', '#e5e7eb'), overflow: 'hidden' }}>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#6b7280'), fontSize: '12px' }}>No image</div>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', color: c('text', '#111'), margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                      <span style={{ fontSize: '12px', color: c('salePriceColor', '#dc2626'), textDecoration: 'line-through', marginRight: '6px' }}>{p.compareAtPrice} {currency}</span>
                    )}
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: c('priceColor', '#059669'), margin: 0 }}>{p.basePrice} {currency}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
              <button onClick={() => updateParam('page', String(Math.max(1, page - 1)))} disabled={page <= 1} style={{
                padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', background: '#fff', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
              }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: '14px', padding: '0 12px' }}>Page {page} of {data.totalPages}</span>
              <button onClick={() => updateParam('page', String(Math.min(data.totalPages, page + 1)))} disabled={page >= data.totalPages} style={{
                padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', background: '#fff', cursor: page >= data.totalPages ? 'default' : 'pointer', opacity: page >= data.totalPages ? 0.5 : 1,
              }}><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
