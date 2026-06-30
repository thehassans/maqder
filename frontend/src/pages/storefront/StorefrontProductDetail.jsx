import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check, Minus, Plus, ChevronRight, Star, Heart, ZoomIn, Truck, Share2, MessageCircle, ShieldCheck, RotateCcw, GitCompare, BellRing, HelpCircle } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCompare } from '../../store/storefrontCompare';
import { firePixelEvent } from '../../components/storefront/StorefrontLayout';
import StorefrontSeo from '../../components/storefront/StorefrontSeo';
import StorefrontBreadcrumbs from '../../components/storefront/StorefrontBreadcrumbs';
import { useRecentlyViewed } from '../../store/recentlyViewed';
import { ProductDetailSkeleton, useToast } from '../../components/storefront/StorefrontUi';

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
  const { toggleCompare, isInCompare } = useCompare();
  const { addProduct, items: recentItems } = useRecentlyViewed();
  const { toast } = useToast();
  const [hoverZoom, setHoverZoom] = useState({ active: false, x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({ question: '', askerName: '', askerEmail: '' });
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionMessage, setQuestionMessage] = useState('');

  const handleNotifyStock = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus('loading');
    try {
      await storeApi.post(`/products/${data.product._id}/notify-stock`, { email: notifyEmail, variantId: selectedVariant });
      setNotifyStatus('success');
      setNotifyEmail('');
    } catch {
      setNotifyStatus('error');
    }
  };

  const isOutOfStock = (() => {
    if (!data?.product) return false;
    const p = data.product;
    if (p.hasVariants && selectedVariant) {
      const v = p.variants.find(v => v._id === selectedVariant);
      return v?.trackInventory && v.stockQuantity <= 0;
    }
    return !p.hasVariants && p.trackInventory && p.stockQuantity <= 0;
  })();

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
      storeApi.get(`/products/${id}/questions`).then(res => setQuestions(res.data.questions || [])).catch(() => {});
    }
  }, [id]);

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.question.trim()) return;
    setQuestionSubmitting(true);
    setQuestionMessage('');
    try {
      await storeApi.post(`/products/${id}/questions`, questionForm);
      setQuestionMessage('Question submitted! We\'ll answer it soon.');
      setQuestionForm({ question: '', askerName: '', askerEmail: '' });
    } catch (err) {
      setQuestionMessage(err.response?.data?.error || 'Failed to submit question');
    } finally {
      setQuestionSubmitting(false);
    }
  };

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
    toast('Added to cart');
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <ProductDetailSkeleton />;
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }} className="store-pd-grid">
        {/* Images */}
        <div className="store-pd-gallery" style={{ position: 'sticky', top: '20px' }}>
          <div style={{ aspectRatio: '1', borderRadius: '20px', overflow: 'hidden', background: '#f3f4f6', marginBottom: '14px', position: 'relative', cursor: 'zoom-in', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            onClick={() => setZoomed(true)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setHoverZoom({ active: true, x, y });
            }}
            onMouseLeave={() => setHoverZoom({ active: false, x: 50, y: 50 })}
          >
            {product.images?.[selectedImage]?.url ? (
              <>
                <img src={product.images[selectedImage].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease', transform: hoverZoom.active ? `scale(2)` : 'scale(1)', transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%` }} />
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                  <ZoomIn size={14} /> Zoom
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} style={{
                  width: '68px', height: '68px', borderRadius: '12px', overflow: 'hidden', border: selectedImage === idx ? '2px solid #4f46e5' : '1px solid #e5e7eb', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                }} onMouseEnter={e => { if (selectedImage !== idx) e.currentTarget.style.borderColor = '#c7d2fe'; }} onMouseLeave={e => { if (selectedImage !== idx) e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 700 }}>{product.category}</p>}
          <h1 className="store-pd-title" style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{product.title}</h1>

          {/* Share buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>Share:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(product.title + ' - ' + currentPrice + ' ' + currency + ' ' + window.location.href)}`} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#25D366', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#1877F2', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title + ' - ' + currentPrice + ' ' + currency)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#000', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </a>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              {linkCopied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Copy Link</>}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span style={{ fontSize: '18px', color: '#dc2626', textDecoration: 'line-through', fontWeight: 600 }}>{product.compareAtPrice} {currency}</span>
            )}
            <span style={{ fontSize: '30px', fontWeight: 800, color: '#059669', letterSpacing: '-0.5px' }}>{currentPrice} {currency}</span>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>Save {Math.round((1 - currentPrice / product.compareAtPrice) * 100)}%</span>
            )}
          </div>

          {product.shortDescription && (
            <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: 1.6, marginBottom: '20px' }}>{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Options:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.filter(v => v.isActive).map(v => {
                  const outOfStock = v.trackInventory && v.stockQuantity <= 0;
                  return (
                    <button key={v._id} onClick={() => setSelectedVariant(v._id)} disabled={outOfStock} style={{
                      padding: '8px 16px', borderRadius: '8px', border: selectedVariant === v._id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                      background: selectedVariant === v._id ? '#eef2ff' : '#fff', cursor: outOfStock ? 'not-allowed' : 'pointer', fontSize: '14px',
                      opacity: outOfStock ? 0.4 : 1, textDecoration: outOfStock ? 'line-through' : 'none',
                    }}>
                      {[v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ')}
                      {v.price && v.price !== product.basePrice ? ` — ${v.price} ${currency}` : ''}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const sel = product.variants.find(v => v._id === selectedVariant);
                if (sel?.trackInventory && sel.stockQuantity <= 5 && sel.stockQuantity > 0) {
                  return <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold', marginTop: '8px' }}>Only {sel.stockQuantity} left in stock!</p>;
                }
                if (sel?.trackInventory && sel.stockQuantity <= 0) {
                  return <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold', marginTop: '8px' }}>Out of stock</p>;
                }
                return null;
              })()}
            </div>
          )}

          {/* Stock status for non-variant products */}
          {!product.hasVariants && product.trackInventory && (
            <div style={{ marginBottom: '16px' }}>
              {product.stockQuantity <= 0 ? (
                <p style={{ fontSize: '14px', color: '#dc2626', fontWeight: 'bold' }}>Out of stock</p>
              ) : product.stockQuantity <= 5 ? (
                <p style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold' }}>Only {product.stockQuantity} left in stock!</p>
              ) : (
                <p style={{ fontSize: '14px', color: '#059669', fontWeight: 'bold' }}>✓ In stock</p>
              )}
            </div>
          )}

          {/* Bulk pricing tiers */}
          {product.priceTiers && product.priceTiers.length > 0 && (
            <div style={{ marginBottom: '16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px', color: '#374151' }}>Bulk Discount Tiers:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.priceTiers.sort((a, b) => a.minQty - b.minQty).map((tier, i) => (
                  <div key={i} style={{
                    padding: '6px 12px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px',
                  }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{tier.minQty}+ qty</span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>{tier.price} {currency}</span>
                    {tier.price < currentPrice && (
                      <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 'bold' }}>
                        Save {Math.round((1 - tier.price / currentPrice) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated delivery */}
          {product.status !== 'out_of_stock' && (
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={16} style={{ color: '#6b7280' }} />
              <span>Estimated delivery: <strong style={{ color: '#111' }}>{(() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                const d2 = new Date();
                d2.setDate(d2.getDate() + 7);
                return `${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })} — ${d2.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`;
              })()}</strong></span>
            </div>
          )}

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', padding: '16px', background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
              <Truck size={16} style={{ color: '#4f46e5' }} /> Free shipping over 200 SAR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
              <ShieldCheck size={16} style={{ color: '#059669' }} /> Secure payment
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
              <RotateCcw size={16} style={{ color: '#f59e0b' }} /> 7-day returns
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '12px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Minus size={16} /></button>
              <span style={{ padding: '0 20px', fontWeight: 700, fontSize: '16px' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '12px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Plus size={16} /></button>
            </div>
            <button onClick={handleAddToCart} style={{
              flex: '1 1 160px', minWidth: 0, padding: '14px 24px', background: added ? '#059669' : 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap',
              transition: 'all 0.2s', boxShadow: added ? '0 4px 14px rgba(5,150,105,0.25)' : '0 4px 14px rgba(79,70,229,0.25)',
            }} onMouseEnter={e => { if (!added) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {added ? <><Check size={18} /> Added!</> : <><ShoppingCart size={18} /> Add to Cart</>}
            </button>
            <button onClick={() => {
              const wasInWishlist = isInWishlist(data.product._id);
              toggleWishlist(data.product);
              toast(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'wishlist');
              if (!wasInWishlist) {
                firePixelEvent('AddToWishlist', {
                  content_ids: [data.product._id],
                  content_name: data.product.title,
                  content_type: 'product',
                  value: data.product.basePrice,
                  currency: data.product.currency || 'SAR',
                });
              }
            }} style={{
              padding: '12px', background: isInWishlist(data.product._id) ? '#fee2e2' : '#fff', border: `1px solid ${isInWishlist(data.product._id) ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Heart size={20} style={{ color: isInWishlist(data.product._id) ? '#dc2626' : '#9ca3af', fill: isInWishlist(data.product._id) ? '#dc2626' : 'none' }} />
            </button>
            <button onClick={() => { toggleCompare(data.product._id); toast(isInCompare(data.product._id) ? 'Removed from compare' : 'Added to compare'); }} title="Compare" style={{
              padding: '12px', background: isInCompare(data.product._id) ? '#eef2ff' : '#fff', border: `1px solid ${isInCompare(data.product._id) ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <GitCompare size={20} style={{ color: isInCompare(data.product._id) ? '#4f46e5' : '#9ca3af' }} />
            </button>
          </div>

          {/* Back-in-stock notification */}
          {isOutOfStock && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
              {notifyStatus === 'success' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={20} style={{ color: '#059669' }} />
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0 }}>You're subscribed! We'll email you when this item is back in stock.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <BellRing size={18} style={{ color: '#f59e0b' }} />
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Notify me when this item is back in stock</p>
                  </div>
                  <form onSubmit={handleNotifyStock} style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" required value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                    <button type="submit" disabled={notifyStatus === 'loading'} style={{ padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>{notifyStatus === 'loading' ? '...' : 'Notify Me'}</button>
                  </form>
                  {notifyStatus === 'error' && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>Failed to subscribe. Please try again.</p>}
                </>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>Description</h3>
              <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>You may also like</h2>
          <div className="store-related-grid">
            {related.map(p => {
              const slug = p.seo?.slug || p._id;
              return (
                <Link key={p._id} to={`/store/products/${slug}`} style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                  <div style={{ aspectRatio: '1', background: '#e5e7eb', overflow: 'hidden' }}>
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} /> : null}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111' }}>{p.title}</p>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: '#059669', margin: 0 }}>{p.basePrice} {currency}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>Customer Reviews</h2>
        {reviews.totalReviews > 0 && (
          <div style={{ display: 'flex', gap: '32px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center', minWidth: '140px', padding: '20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '44px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>{reviews.avgRating.toFixed(1)}</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} className={n <= Math.round(reviews.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, fontWeight: 500 }}>{reviews.totalReviews} reviews</p>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.reviews.filter(r => r.rating === star).length;
                const pct = reviews.totalReviews > 0 ? (count / reviews.totalReviews) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '24px' }}>{star}★</span>
                    <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: '999px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '24px', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
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

      {/* Q&A section */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={22} style={{ color: '#4f46e5' }} /> Questions & Answers
        </h2>

        {/* Question list */}
        {questions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {questions.map(q => (
              <div key={q._id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle size={16} style={{ color: '#4f46e5' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px' }}>{q.question}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px' }}>{q.askerName ? `${q.askerName} · ` : ''}{new Date(q.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MessageCircle size={16} style={{ color: '#059669' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.5 }}>{q.answer}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Answered {new Date(q.answeredAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>No questions yet. Be the first to ask!</p>
        )}

        {/* Question form */}
        <form onSubmit={handleQuestionSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Ask a Question</h3>
          {questionMessage && <p style={{ fontSize: '13px', color: questionMessage.includes('Failed') ? '#dc2626' : '#059669', marginBottom: '12px' }}>{questionMessage}</p>}
          <textarea required placeholder="Your question *" value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '60px', marginBottom: '12px', resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input placeholder="Your name (optional)" value={questionForm.askerName} onChange={e => setQuestionForm({ ...questionForm, askerName: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            <input type="email" placeholder="Email (optional)" value={questionForm.askerEmail} onChange={e => setQuestionForm({ ...questionForm, askerEmail: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
          </div>
          <button type="submit" disabled={questionSubmitting} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: questionSubmitting ? 0.6 : 1 }}>
            {questionSubmitting ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
      </div>

      <style>{`
        .store-related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
        @media(max-width:768px){
          .store-pd-grid{grid-template-columns:1fr!important;gap:24px!important}
          .store-reviews-grid{grid-template-columns:1fr!important}
          .store-pd-gallery{position:static!important}
          .store-pd-title{font-size:24px!important}
          .store-related-grid{grid-template-columns:repeat(2,1fr);gap:14px}
        }
      `}</style>

      {/* Image zoom modal */}
      {zoomed && product.images?.[selectedImage]?.url && (
        <div onClick={() => setZoomed(false)} style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '20px',
        }}>
          <img src={product.images[selectedImage].url} alt={product.title} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
          <button onClick={() => setZoomed(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#fff', fontSize: '20px' }}>×</button>
        </div>
      )}

      {/* Recently viewed products */}
      {recentItems.filter(i => i.productId !== product._id && i.productId !== id).length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>Recently Viewed</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {recentItems.filter(i => i.productId !== product._id && i.productId !== id).slice(0, 6).map(item => (
              <Link key={item.productId} to={`/store/products/${item.slug}`} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', textDecoration: 'none' }}>
                {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{item.price} SAR</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky add-to-cart bar (mobile only) */}
      <div className="md:hidden" style={{
        position: 'fixed', bottom: '60px', left: 0, right: 0, zIndex: 90, maxWidth: '100%',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid #e5e7eb', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#059669', margin: 0, letterSpacing: '-0.3px' }}>{currentPrice} {currency}</p>
        </div>
        <button onClick={handleAddToCart} disabled={isOutOfStock} style={{
          padding: '12px 22px', background: added ? '#059669' : 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '12px',
          fontWeight: 700, fontSize: '14px', cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.5 : 1,
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
        }}>
          {added ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> {isOutOfStock ? 'Sold Out' : 'Add to Cart'}</>}
        </button>
      </div>
      {/* Spacer so content is not hidden behind the sticky bar + bottom nav */}
      <div className="md:hidden" style={{ height: '70px' }} />
    </div>
  );
}
