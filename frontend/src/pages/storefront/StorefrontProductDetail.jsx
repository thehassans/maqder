import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check, Minus, Plus, ChevronRight, Star, Heart, ZoomIn, Truck, Share2, MessageCircle, ShieldCheck, RotateCcw, GitCompare, BellRing } from 'lucide-react';
import SaudiRiyalSymbol from '../../components/storefront/SaudiRiyalSymbol';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { useCompare } from '../../store/storefrontCompare';
import { useI18n } from '../../store/storefrontI18n';
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
  const { t, isRTL } = useI18n();
  const [hoverZoom, setHoverZoom] = useState({ active: false, x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState('');

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
        { label: t('products'), href: '/store/products' },
        { label: product.title },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'start', marginTop: '24px' }} className="store-pd-grid">
        {/* Images */}
        <div className="store-pd-gallery" style={{ position: 'sticky', top: '20px' }}>
          <div style={{ aspectRatio: '1', borderRadius: '24px', overflow: 'hidden', background: '#f8f8f8', marginBottom: '16px', position: 'relative', cursor: 'zoom-in', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}
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
                <div style={{ position: 'absolute', bottom: '14px', right: '14px', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px', color: '#111', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(12px)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <ZoomIn size={14} /> {t('zoom')}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>{t('noImage')}</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} style={{
                  width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', border: selectedImage === idx ? '2px solid #111' : '1px solid #eee', cursor: 'pointer', flexShrink: 0, transition: 'all 0.25s', opacity: selectedImage === idx ? 1 : 0.6,
                }} onMouseEnter={e => { if (selectedImage !== idx) { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.opacity = '0.85'; } }} onMouseLeave={e => { if (selectedImage !== idx) { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.opacity = '0.6'; } }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '8px 0' }}>
          {product.category && <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: 700 }}>{product.category}</p>}
          <h1 className="store-pd-title" style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.8px', lineHeight: 1.15, color: '#111' }}>{product.title}</h1>

          {/* Rating row */}
          {reviews.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} style={{ color: n <= Math.round(reviews.avgRating) ? '#f59e0b' : '#e5e7eb', fill: n <= Math.round(reviews.avgRating) ? '#f59e0b' : '#e5e7eb' }} />
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#999', fontWeight: 500 }}>{reviews.avgRating.toFixed(1)} · {reviews.totalReviews} {t('reviews')}</span>
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span style={{ fontSize: '18px', color: '#bbb', textDecoration: 'line-through', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px' }}>
                {product.compareAtPrice} <SaudiRiyalSymbol size={14} color="#bbb" />
              </span>
            )}
            <span style={{ fontSize: '36px', fontWeight: 800, color: '#111', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {currentPrice} <SaudiRiyalSymbol size={24} color="#111" />
            </span>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span style={{ background: '#111', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.03em' }}>{t('save')} {Math.round((1 - currentPrice / product.compareAtPrice) * 100)}%</span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, marginBottom: '28px', maxWidth: '440px' }}>{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('options')}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.variants.filter(v => v.isActive).map(v => {
                  const outOfStock = v.trackInventory && v.stockQuantity <= 0;
                  return (
                    <button key={v._id} onClick={() => setSelectedVariant(v._id)} disabled={outOfStock} style={{
                      padding: '10px 18px', borderRadius: '12px', border: selectedVariant === v._id ? '2px solid #111' : '1px solid #e5e7eb',
                      background: selectedVariant === v._id ? '#111' : '#fff', color: selectedVariant === v._id ? '#fff' : '#111',
                      cursor: outOfStock ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600,
                      opacity: outOfStock ? 0.35 : 1, textDecoration: outOfStock ? 'line-through' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      {[v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ')}
                      {v.price && v.price !== product.basePrice ? ` · ${v.price}` : ''}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const sel = product.variants.find(v => v._id === selectedVariant);
                if (sel?.trackInventory && sel.stockQuantity <= 5 && sel.stockQuantity > 0) {
                  return <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600, marginTop: '10px' }}>{t('onlyLeftInStock')} {sel.stockQuantity} {t('leftInStock')}</p>;
                }
                if (sel?.trackInventory && sel.stockQuantity <= 0) {
                  return <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '10px' }}>{t('outOfStock')}</p>;
                }
                return null;
              })()}
            </div>
          )}

          {/* Stock status for non-variant products */}
          {!product.hasVariants && product.trackInventory && (
            <div style={{ marginBottom: '20px' }}>
              {product.stockQuantity <= 0 ? (
                <p style={{ fontSize: '14px', color: '#dc2626', fontWeight: 600 }}>{t('outOfStock')}</p>
              ) : product.stockQuantity <= 5 ? (
                <p style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>{t('onlyLeftInStock')} {product.stockQuantity} {t('leftInStock')}</p>
              ) : (
                <p style={{ fontSize: '14px', color: '#059669', fontWeight: 600 }}>{t('inStock')}</p>
              )}
            </div>
          )}

          {/* Bulk pricing tiers */}
          {product.priceTiers && product.priceTiers.length > 0 && (
            <div style={{ marginBottom: '20px', background: '#f9f9f9', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 12px', color: '#111', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('bulkDiscountTiers')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.priceTiers.sort((a, b) => a.minQty - b.minQty).map((tier, i) => (
                  <div key={i} style={{
                    padding: '8px 14px', borderRadius: '12px', background: '#fff', border: '1px solid #eee',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px',
                  }}>
                    <span style={{ fontSize: '11px', color: '#999' }}>{tier.minQty}+ {t('qty')}</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}>{tier.price} <SaudiRiyalSymbol size={11} color="#059669" /></span>
                    {tier.price < currentPrice && (
                      <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>
                        {t('save')} {Math.round((1 - tier.price / currentPrice) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated delivery */}
          {product.status !== 'out_of_stock' && (
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={16} style={{ color: '#999' }} />
              <span>{t('estimatedDelivery')}: <strong style={{ color: '#111' }}>{(() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                const d2 = new Date();
                d2.setDate(d2.getDate() + 7);
                const locale = isRTL ? 'ar' : 'en';
                return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} — ${d2.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`;
              })()}</strong></span>
            </div>
          )}

          {/* Trust badges - minimal */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '28px', padding: '14px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', fontWeight: 500 }}>
              <Truck size={15} style={{ color: '#999' }} /> {t('freeShippingSub')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', fontWeight: 500 }}>
              <ShieldCheck size={15} style={{ color: '#999' }} /> {t('securePayment')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', fontWeight: 500 }}>
              <RotateCcw size={15} style={{ color: '#999' }} /> {t('easyReturnsSub')}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Minus size={16} /></button>
              <span style={{ padding: '0 24px', fontWeight: 700, fontSize: '16px' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Plus size={16} /></button>
            </div>
            <button onClick={handleAddToCart} style={{
              flex: '1 1 180px', minWidth: 0, padding: '16px 28px', background: added ? '#059669' : '#111', color: '#fff', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap',
              transition: 'all 0.25s', boxShadow: added ? '0 4px 14px rgba(5,150,105,0.2)' : '0 4px 14px rgba(0,0,0,0.12)',
            }} onMouseEnter={e => { if (!added) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {added ? <><Check size={18} /> {t('added')}</> : <><ShoppingCart size={18} /> {t('addToCart')}</>}
            </button>
            <button onClick={() => {
              const wasInWishlist = isInWishlist(data.product._id);
              toggleWishlist(data.product);
              toast(wasInWishlist ? t('removedFromWishlist') : t('addedToWishlist'), 'wishlist');
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
              padding: '14px', background: isInWishlist(data.product._id) ? '#fee2e2' : '#fff', border: `1px solid ${isInWishlist(data.product._id) ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Heart size={20} style={{ color: isInWishlist(data.product._id) ? '#dc2626' : '#999', fill: isInWishlist(data.product._id) ? '#dc2626' : 'none' }} />
            </button>
            <button onClick={() => { toggleCompare(data.product._id); toast(isInCompare(data.product._id) ? t('removedFromCompare') : t('addedToCompare')); }} title={t('compare')} style={{
              padding: '14px', background: isInCompare(data.product._id) ? '#f5f5f5' : '#fff', border: `1px solid ${isInCompare(data.product._id) ? '#111' : '#e5e7eb'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <GitCompare size={20} style={{ color: isInCompare(data.product._id) ? '#111' : '#999' }} />
            </button>
          </div>

          {/* Share buttons - ultra minimalistic */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>{t('share')}</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(product.title + ' ' + window.location.href)}`} target="_blank" rel="noopener" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.color = '#666'; }}>
              <MessageCircle size={14} />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.color = '#666'; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.color = '#666'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }} style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${linkCopied ? '#059669' : '#eee'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: linkCopied ? '#059669' : '#666', background: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { if (!linkCopied) { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; } }} onMouseLeave={e => { if (!linkCopied) { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.color = '#666'; } }}>
              {linkCopied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
          </div>

          {/* Back-in-stock notification */}
          {isOutOfStock && (
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
              {notifyStatus === 'success' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={20} style={{ color: '#059669' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#059669', margin: 0 }}>{t('notifySubscribed')}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BellRing size={18} style={{ color: '#f59e0b' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#111' }}>{t('notifyBackInStock')}</p>
                  </div>
                  <form onSubmit={handleNotifyStock} style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" required value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', outline: 'none' }} />
                    <button type="submit" disabled={notifyStatus === 'loading'} style={{ padding: '12px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{notifyStatus === 'loading' ? '...' : t('notifyMe')}</button>
                  </form>
                  {notifyStatus === 'error' && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>{t('failedSubscribe')}</p>}
                </>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>{t('description')}</h3>
              <div style={{ fontSize: '15px', color: '#555', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>{t('youMayAlsoLike')}</h2>
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
                    <p style={{ fontSize: '17px', fontWeight: 800, color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>{p.basePrice} <SaudiRiyalSymbol size={13} color="#059669" /></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>{t('customerReviews')}</h2>
        {reviews.totalReviews > 0 && (
          <div style={{ display: 'flex', gap: '32px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'center', minWidth: '140px', padding: '20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '44px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-1px' }}>{reviews.avgRating.toFixed(1)}</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} className={n <= Math.round(reviews.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, fontWeight: 500 }}>{reviews.totalReviews} {t('reviews')}</p>
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
                {r.verifiedPurchase && <span style={{ fontSize: '11px', background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: '999px', fontWeight: 'bold' }}>{t('verified')}</span>}
              </div>
              {r.title && <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{r.title}</p>}
              {r.body && <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>{r.body}</p>}
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>— {r.customerName} · {new Date(r.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en')}</p>
            </div>
          ))}
        </div>

        {/* Review form */}
        <form onSubmit={handleReviewSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>{t('writeReview')}</h3>
          {reviewMessage && <p style={{ fontSize: '13px', color: reviewMessage.includes('Failed') || reviewMessage.includes('already') ? '#dc2626' : '#059669', marginBottom: '12px' }}>{reviewMessage}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input placeholder={t('yourName')} required value={reviewForm.customerName} onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            <input placeholder={t('emailOptional')} type="email" value={reviewForm.customerEmail} onChange={e => setReviewForm({ ...reviewForm, customerEmail: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('rating')}</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                <Star size={20} className={n <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <input placeholder={t('reviewTitle')} value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }} />
          <textarea placeholder={t('yourReview')} value={reviewForm.body} onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', minHeight: '80px', marginBottom: '12px' }} />
          <button type="submit" disabled={reviewSubmitting} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: reviewSubmitting ? 0.6 : 1 }}>
            {reviewSubmitting ? t('submitting') : t('submitReview')}
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
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>{t('recentlyViewed')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {recentItems.filter(i => i.productId !== product._id && i.productId !== id).slice(0, 6).map(item => (
              <Link key={item.productId} to={`/store/products/${item.slug}`} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', textDecoration: 'none' }}>
                {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>{item.price} <SaudiRiyalSymbol size={11} color="#059669" /></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
