import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, X, Loader2, ShoppingCart, Check, Trash2 } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useCompare } from '../../store/storefrontCompare';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';

export default function StorefrontCompare() {
  const { productIds, removeFromCompare, clearCompare, count } = useCompare();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (productIds.length === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(productIds.map(id => storeApi.get(`/products/${id}`).then(res => res.data).catch(() => null)))
      .then(results => {
        const valid = results.filter(r => r !== null);
        setProducts(valid);
      })
      .finally(() => setLoading(false));
  }, [productIds]);

  const currency = storeInfo?.currency || 'SAR';
  const theme = storeInfo?.theme || {};
  const colors = theme.colors || {};
  const c = (key, fallback) => colors[key] || fallback;

  const specs = products.length > 0 ? [
    { label: 'Price', key: 'price', render: (p) => `${p.basePrice} ${currency}` },
    { label: 'Compare At', key: 'compareAt', render: (p) => p.compareAtPrice ? `${p.compareAtPrice} ${currency}` : '—' },
    { label: 'Category', key: 'category', render: (p) => p.category || '—' },
    { label: 'Brand', key: 'brand', render: (p) => p.brand || '—' },
    { label: 'SKU', key: 'sku', render: (p) => p.sku || '—' },
    { label: 'In Stock', key: 'stock', render: (p) => p.trackInventory ? `${p.stockQuantity} units` : 'Yes' },
    { label: 'Rating', key: 'rating', render: (p) => p.avgRating ? `${p.avgRating.toFixed(1)} / 5` : 'No reviews' },
    { label: 'Weight', key: 'weight', render: (p) => p.weight ? `${p.weight} kg` : '—' },
    { label: 'Tags', key: 'tags', render: (p) => p.tags?.length ? p.tags.join(', ') : '—' },
    { label: 'Description', key: 'desc', render: (p) => p.description ? (p.description.length > 100 ? p.description.substring(0, 100) + '...' : p.description) : '—' },
  ] : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <StorefrontSeo title="Compare Products" />
      <StorefrontBreadcrumbs items={[{ label: 'Home', path: '/store' }, { label: 'Compare' }]} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GitCompare size={32} style={{ color: c('primary', '#4f46e5') }} />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Compare Products</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>{count} of 4 products selected</p>
          </div>
        </div>
        {count > 0 && (
          <button onClick={clearCompare} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#dc2626' }}>
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: c('primary', '#4f46e5') }} />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <GitCompare size={64} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>No products to compare</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
            Add products to compare by clicking the compare icon on product cards
          </p>
          <Link to="/store/products" style={{ display: 'inline-block', padding: '12px 28px', background: c('primary', '#4f46e5'), color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb', width: '140px' }}></th>
                {products.map(p => {
                  const slug = p.seo?.slug || p._id;
                  return (
                    <th key={p._id} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e5e7eb', minWidth: '180px' }}>
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => removeFromCompare(p._id)} style={{ position: 'absolute', top: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={14} color="#dc2626" />
                        </button>
                        <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none' }}>
                          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', marginBottom: '8px' }}>
                            {p.images?.[0]?.url ? (
                              <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: c('text', '#111'), margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                        </Link>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: c('priceColor', '#059669'), margin: '0 0 8px' }}>{p.basePrice} {currency}</p>
                        <button
                          onClick={() => addItem({ productId: p._id, title: p.title, price: p.basePrice, image: p.images?.[0]?.url, quantity: 1 })}
                          style={{ width: '100%', padding: '8px', background: c('primary', '#4f46e5'), color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <ShoppingCart size={14} /> Add to Cart
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={spec.key} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 'bold', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{spec.label}</td>
                  {products.map(p => (
                    <td key={p._id} style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      {spec.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
