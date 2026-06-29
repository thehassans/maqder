import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check, Minus, Plus, ChevronRight, Star, Heart, ZoomIn } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import { useRecentlyViewed } from '../../store/recentlyViewed';

export default function StorefrontProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState({ reviews: [], avgRating: 0, totalReviews: 0 });
  const [reviewForm, setReviewForm] = useState({ customerName: '', customerEmail: '', rating: 5, title: '', body: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addProduct } = useRecentlyViewed();
  const [zoomed, setZoomed] = useState(false);

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
        // Fire ViewContent pixel event
        firePixelEvent('ViewContent', {
          content_ids: [res.data.product._id],
          content_name: res.data.product.title,
          content_type: 'product',
          value: res.data.product.basePrice,
          currency: 'SAR',
        });
        // Add to recently viewed
        addProduct(res.data.product);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (id) {
      storeApi.get(`/reviews/product/${id}`).then(res => setReviews(res.data)).catch(() => {});
    }
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.customerName || !reviewForm.rating) return;
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      await storeApi.post(`/reviews/product/${id}`, reviewForm);
      setReviewMessage('Review submitted! It will appear after approval.');
      setReviewForm({ customerName: '', customerEmail: '', rating: 5, title: '', body: '' });
    } catch (err) {
      setReviewMessage(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    const product = data.product;
    addItem(product, quantity, selectedVariant);
    // Fire AddToCart pixel event
    firePixelEvent('AddToCart', {
      content_ids: [product._id],
      content_name: product.title,
      content_type: 'product',
      value: product.basePrice * quantity,
      currency: 'SAR',
    });
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
      <StorefrontSeo
        title={`${product.title} — ${product.basePrice} ${currency}`}
        description={product.seo?.metaDescription || product.description?.replace(/<[^>]*>/g, '').slice(0, 160) || product.title}
        image={product.images?.[0]?.url}
        url={window.location.href}
        type="product"
        siteName="Store"
      />
      <StorefrontBreadcrumbs items={[
        { label: 'Products', href: '/store/products' },
        { label: product.title },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }} className="store-pd-grid">
        {/* Images */}
        <div>
          <div style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: '#f3f4f6', marginBottom: '12px', position: 'relative', cursor: 'zoom-in' }}
            onClick={() => setZoomed(true)}
          >
            {product.images?.[selectedImage]?.url ? (
              <>
                <img src={product.images[selectedImage].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '12px' }}>
                  <ZoomIn size={14} /> Zoom
                </div>
              </>
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
            <button onClick={() => toggleWishlist(data.product)} style={{
              padding: '12px', background: isInWishlist(data.product._id) ? '#fee2e2' : '#fff', border: `1px solid ${isInWishlist(data.product._id) ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer',
            }}>
              <Heart size={20} style={{ color: isInWishlist(data.product._id) ? '#dc2626' : '#9ca3af', fill: isInWishlist(data.product._id) ? '#dc2626' : 'none' }} />
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

      {/* Reviews section */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>Customer Reviews</h2>
        {reviews.totalReviews > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={20} className={n <= Math.round(reviews.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
              ))}
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{reviews.avgRating.toFixed(1)}</span>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>({reviews.totalReviews} reviews)</span>
          </div>
        )}

        {/* Review list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }} className="store-reviews-grid">
          {reviews.reviews.map(r => (
            <div key={r._id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={12} className={n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                {r.verifiedPurchase && <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: 'bold' }}>Verified</span>}
              </div>
              {r.title && <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{r.title}</p>}
              {r.body && <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>{r.body}</p>}
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>— {r.customerName} · {new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {/* Review form */}
        <form onSubmit={handleReviewSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Write a Review</h3>
          {reviewMessage && <p style={{ fontSize: '13px', color: reviewMessage.includes('Failed') || reviewMessage.includes('already') ? '#dc2626' : '#059669', marginBottom: '12px' }}>{reviewMessage}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input placeholder="Your name *" required value={reviewForm.customerName} onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            <input placeholder="Email (optional)" type="email" value={reviewForm.customerEmail} onChange={e => setReviewForm({ ...reviewForm, customerEmail: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Rating:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                <Star size={20} className={n <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <input placeholder="Review title (optional)" value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }} />
          <textarea placeholder="Your review (optional)" value={reviewForm.body} onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px', marginBottom: '12px' }} />
          <button type="submit" disabled={reviewSubmitting} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: reviewSubmitting ? 0.6 : 1 }}>
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      <style>{`@media(max-width:768px){.store-pd-grid{grid-template-columns:1fr!important}.store-reviews-grid{grid-template-columns:1fr!important}}`}</style>

      {/* Image zoom modal */}
      {zoomed && product.images?.[selectedImage]?.url && (
        <div onClick={() => setZoomed(false)} style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '20px',
        }}>
          <img src={product.images[selectedImage].url} alt={product.title} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
          <button onClick={() => setZoomed(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '20px' }}>×</button>
        </div>
      )}
    </div>
  );
}
