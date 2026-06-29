import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check, Minus, Plus, ChevronRight } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';

export default function StorefrontProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    setError('');
    storeApi.get(`/products/${id}`)
      .then(res => {
        setData(res.data);
        if (res.data.product?.variants?.length > 0) {
          const firstActive = res.data.product.variants.find(v => v.isActive);
          setSelectedVariant(firstActive?._id || null);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    const product = data.product;
    addItem(product, quantity, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}><p>{error}</p><Link to="/store/products" style={{ color: '#4f46e5' }}>Back to products</Link></div>;
  if (!data?.product) return null;

  const product = data.product;
  const related = data.related || [];
  const currency = 'SAR';
  const currentPrice = product.hasVariants && selectedVariant
    ? (product.variants.find(v => v._id === selectedVariant)?.price || product.basePrice)
    : product.basePrice;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
        <Link to="/store" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/store/products" style={{ color: '#6b7280', textDecoration: 'none' }}>Products</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#111' }}>{product.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }} className="store-pd-grid">
        {/* Images */}
        <div>
          <div style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', marginBottom: '12px' }}>
            {product.images?.[selectedImage]?.url ? (
              <img src={product.images[selectedImage].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} style={{
                  width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: selectedImage === idx ? '2px solid #4f46e5' : '1px solid #e5e7eb', cursor: 'pointer', flexShrink: 0,
                }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{product.category}</p>}
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px' }}>{product.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span style={{ fontSize: '16px', color: '#dc2626', textDecoration: 'line-through' }}>{product.compareAtPrice} {currency}</span>
            )}
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>{currentPrice} {currency}</span>
          </div>

          {product.shortDescription && (
            <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.6, marginBottom: '20px' }}>{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Options:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.filter(v => v.isActive).map(v => (
                  <button key={v._id} onClick={() => setSelectedVariant(v._id)} style={{
                    padding: '8px 16px', borderRadius: '8px', border: selectedVariant === v._id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                    background: selectedVariant === v._id ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: '14px',
                  }}>
                    {[v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={16} /></button>
              <span style={{ padding: '0 16px', fontWeight: 'bold' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={16} /></button>
            </div>
            <button onClick={handleAddToCart} style={{
              flex: 1, padding: '12px 24px', background: added ? '#059669' : '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {added ? <><Check size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>Description</h3>
              <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {related.map(p => {
              const slug = p.seo?.slug || p._id;
              return (
                <Link key={p._id} to={`/store/products/${slug}`} style={{
                  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none',
                }}>
                  <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{p.basePrice} {currency}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.store-pd-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
