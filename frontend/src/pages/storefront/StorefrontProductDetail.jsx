import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check, Minus, Plus, ChevronRight, Star, Heart, ZoomIn, Truck, Share2, MessageCircle, ShieldCheck, RotateCcw, GitCompare, BellRing, ThumbsUp, ImagePlus, X, Package, Eye } from 'lucide-react';
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
import Accordion from '../../components/storefront/Accordion';
import BottomSheet from '../../components/storefront/BottomSheet';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { optimizeImageUrl } from '../../lib/imageOptimizer';

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
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImageUploading, setReviewImageUploading] = useState(false);
  const [votedReviews, setVotedReviews] = useState(new Set());
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
  const [fbtProducts, setFbtProducts] = useState([]);
  const [fbtSelected, setFbtSelected] = useState(new Set());
  const [fbtLoading, setFbtLoading] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Color utility from theme
  const c = (key, fallback) => data?.colors?.[key] || fallback;

  // Swipe gestures for mobile image gallery
  const imageSwipe = useSwipeGesture({
    onSwipeLeft: () => {
      if (data?.product?.images?.length > 1) {
        setSelectedImage(prev => Math.min(prev + 1, data.product.images.length - 1));
      }
    },
    onSwipeRight: () => {
      if (data?.product?.images?.length > 1) {
        setSelectedImage(prev => Math.max(prev - 1, 0));
      }
    },
    threshold: 40,
  });

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

  // Fetch frequently bought together
  useEffect(() => {
    if (!data?.product?._id) return;
    setFbtLoading(true);
    storeApi.get(`/frequently-bought/${data.product._id}`)
      .then(res => {
        setFbtProducts(res.data.products || []);
        setFbtSelected(new Set((res.data.products || []).map(p => p._id)));
      })
      .catch(() => {})
      .finally(() => setFbtLoading(false));
  }, [data?.product?._id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.customerName || !reviewForm.rating) return;
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      await storeApi.post(`/reviews/product/${id}`, { ...reviewForm, images: reviewImages });
      setReviewMessage('Review submitted! It will appear after approval.');
      setReviewForm({ customerName: '', customerEmail: '', rating: 5, title: '', body: '' });
      setReviewImages([]);
    } catch (err) {
      setReviewMessage(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReviewImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await storeApi.post(`/reviews/product/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReviewImages(prev => [...prev, res.data.imageUrl]);
    } catch {
      setReviewMessage('Failed to upload image');
    } finally {
      setReviewImageUploading(false);
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    if (votedReviews.has(reviewId)) return;
    try {
      const voterId = localStorage.getItem('maqder_voter_id') || `voter_${Date.now()}_${Math.random()}`;
      localStorage.setItem('maqder_voter_id', voterId);
      const res = await storeApi.post(`/reviews/${reviewId}/helpful`, { voterId });
      if (!res.data.alreadyVoted) {
        setReviews(prev => ({
          ...prev,
          reviews: prev.reviews.map(r => r._id === reviewId ? { ...r, helpfulVotes: res.data.helpfulVotes } : r),
        }));
      }
      setVotedReviews(prev => new Set([...prev, reviewId]));
    } catch {
      // ignore
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 90px' }}>
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
        <div className="store-pd-gallery sf-no-select" style={{ position: 'sticky', top: '20px' }}>
          <div style={{ aspectRatio: '1', borderRadius: '24px', overflow: 'hidden', background: '#f8f8f8', marginBottom: '16px', position: 'relative', cursor: 'zoom-in', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}
            onClick={() => setZoomed(true)}
            onTouchStart={imageSwipe.onTouchStart}
            onTouchEnd={imageSwipe.onTouchEnd}
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
                <img src={optimizeImageUrl(product.images[selectedImage].url, { width: 800, quality: 85 })} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease', transform: hoverZoom.active ? `scale(2)` : 'scale(1)', transformOrigin: `${hoverZoom.x}% ${hoverZoom.y}%` }} />
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
                  <img src={optimizeImageUrl(img.url, { width: 200, quality: 80 })} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {/* Social proof badges */}
          {(product.viewsCount > 10 || product.salesCount > 5) && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {product.viewsCount > 10 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f3f4f6', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                  <Eye size={14} /> {product.viewsCount} views
                </div>
              )}
              {product.salesCount > 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ecfdf5', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#059669' }}>
                  <ShoppingCart size={14} /> {product.salesCount} sold
                </div>
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
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: '2px' }}>{tier.price} <SaudiRiyalSymbol size={11} color="#111" /></span>
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

          {/* Accordion: Description, Specifications, Shipping & Returns */}
          <Accordion
            colors={data?.colors}
            isRTL={isRTL}
            items={[
              { title: t('description'), content: product.description, raw: true },
              {
                title: t('specifications') || 'Specifications',
                content: product.specifications ? [
                  product.specifications.dimensions && `${t('dimensions') || 'Dimensions'}: ${product.specifications.dimensions}`,
                  product.specifications.material && `${t('material') || 'Material'}: ${product.specifications.material}`,
                  product.specifications.weight && `${t('weight') || 'Weight'}: ${product.specifications.weight}`,
                  product.specifications.color && `${t('color') || 'Color'}: ${product.specifications.color}`,
                  product.specifications.warranty && `${t('warranty') || 'Warranty'}: ${product.specifications.warranty}`,
                  product.specifications.countryOfOrigin && `${t('countryOfOrigin') || 'Country of Origin'}: ${product.specifications.countryOfOrigin}`,
                ].filter(Boolean).join('\n') : '',
              },
              {
                title: t('shippingReturns') || 'Shipping & Returns',
                content: `${t('shippingReturnsDesc') || 'Free shipping on orders over 200 SAR. 7-day return policy. Items must be in original condition with tags attached.'}`,
              },
              {
                title: t('careInstructions') || 'Care Instructions',
                content: product.specifications?.careInstructions || (t('careInstructionsDefault') || 'Follow care label instructions. Machine wash cold with similar colors. Do not bleach. Tumble dry low.'),
              },
            ].filter(item => item.content && item.content.trim())}
          />
        </div>
      </div>

      {/* Frequently Bought Together */}
      {fbtProducts.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={22} /> Frequently Bought Together
          </h2>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {/* Current product */}
              <FBTItem
                product={data.product}
                checked={true}
                alwaysChecked={true}
                onToggle={() => {}}
              />
              {fbtProducts.map(p => (
                <FBTItem
                  key={p._id}
                  product={p}
                  checked={fbtSelected.has(p._id)}
                  onToggle={() => {
                    setFbtSelected(prev => {
                      const next = new Set(prev);
                      if (next.has(p._id)) next.delete(p._id);
                      else next.add(p._id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
            {/* Total + add all */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Total for {1 + fbtSelected.size} item{1 + fbtSelected.size !== 1 ? 's' : ''}: </span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#111', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {(() => {
                    const total = data.product.basePrice + fbtProducts.filter(p => fbtSelected.has(p._id)).reduce((sum, p) => sum + p.basePrice, 0);
                    return Math.round(total * 100) / 100;
                  })()}
                  <SaudiRiyalSymbol size={16} color="#111" />
                </span>
              </div>
              <button
                onClick={() => {
                  addItem(data.product, 1, selectedVariant);
                  fbtProducts.filter(p => fbtSelected.has(p._id)).forEach(p => addItem(p, 1));
                  toast(t('addedToCart'), 'success');
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: c('primary', '#4f46e5'), color: '#fff', border: 'none',
                  padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <ShoppingCart size={18} /> Add All to Cart
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} /> : null}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111' }}>{p.title}</p>
                    <p style={{ fontSize: '17px', fontWeight: 800, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>{p.basePrice} <SaudiRiyalSymbol size={13} color="#111" /></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews section — ultra minimalistic */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.5px', color: '#111' }}>{t('customerReviews')}</h2>
        {reviews.totalReviews > 0 ? (
          <>
            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <p style={{ fontSize: '48px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1.5px', color: '#111' }}>{reviews.avgRating.toFixed(1)}</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={14} style={{ color: n <= Math.round(reviews.avgRating) ? '#f59e0b' : '#e5e7eb', fill: n <= Math.round(reviews.avgRating) ? '#f59e0b' : '#e5e7eb' }} />
                  ))}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, fontWeight: 500 }}>{reviews.totalReviews} {t('reviews')}</p>
              </div>
              <div style={{ flex: 1, minWidth: '200px', maxWidth: '280px' }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.reviews.filter(r => r.rating === star).length;
                  const pct = reviews.totalReviews > 0 ? (count / reviews.totalReviews) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>{star}</span>
                      <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: '999px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '20px', textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }} className="store-reviews-grid">
              {reviews.reviews.map(r => (
                <div key={r._id} style={{ border: `1px solid #f3f4f6`, borderRadius: '12px', padding: '18px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={12} style={{ color: n <= r.rating ? '#f59e0b' : '#e5e7eb', fill: n <= r.rating ? '#f59e0b' : '#e5e7eb' }} />
                      ))}
                    </div>
                    {r.verifiedPurchase && <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '999px', fontWeight: 600, letterSpacing: '0.02em' }}>{t('verified')}</span>}
                  </div>
                  {r.title && <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#111' }}>{r.title}</p>}
                  {r.body && <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', lineHeight: 1.6 }}>{r.body}</p>}
                  {r.images && r.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {r.images.map((img, idx) => (
                        <img key={idx} src={optimizeImageUrl(img.url, { width: 200, quality: 80 })} alt={`Review photo ${idx + 1}`} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => window.open(img.url, '_blank')} />
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <p style={{ fontSize: '11px', color: '#d1d5db' }}>— {r.customerName} · {new Date(r.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en')}</p>
                    <button onClick={() => handleHelpfulVote(r._id)} disabled={votedReviews.has(r._id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: votedReviews.has(r._id) ? 'default' : 'pointer', fontSize: '11px', color: votedReviews.has(r._id) ? '#9ca3af' : '#6b7280', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s' }} onMouseEnter={e => { if (!votedReviews.has(r._id)) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111'; } }} onMouseLeave={e => { if (!votedReviews.has(r._id)) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; } }}>
                      <ThumbsUp size={12} /> {r.helpfulVotes || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', border: `1px dashed ${c('borderColor', '#e5e7eb')}`, borderRadius: '16px', background: '#fafafa' }}>
            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>{t('noReviewsYet')}</p>
          </div>
        )}

        {/* Review form — minimal */}
        <form onSubmit={handleReviewSubmit} style={{ border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '16px', padding: '24px', background: '#fff' }}>
          <h3 style={{ fontWeight: 800, fontSize: '16px', marginBottom: '16px', color: '#111' }}>{t('writeReview')}</h3>
          {reviewMessage && <p style={{ fontSize: '13px', color: reviewMessage.includes('Failed') || reviewMessage.includes('already') ? '#dc2626' : '#16a34a', marginBottom: '12px', fontWeight: 500 }}>{reviewMessage}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input placeholder={t('yourName')} required value={reviewForm.customerName} onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} />
            <input placeholder={t('emailOptional')} type="email" value={reviewForm.customerEmail} onChange={e => setReviewForm({ ...reviewForm, customerEmail: e.target.value })} style={{ padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{t('rating')}</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Star size={20} style={{ color: n <= reviewForm.rating ? '#f59e0b' : '#e5e7eb', fill: n <= reviewForm.rating ? '#f59e0b' : '#e5e7eb', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
              </button>
            ))}
          </div>
          <input placeholder={t('reviewTitle')} value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '14px', marginBottom: '12px', outline: 'none', transition: 'border-color 0.2s' }} />
          <textarea placeholder={t('yourReview')} value={reviewForm.body} onChange={e => setReviewForm({ ...reviewForm, body: e.target.value })} style={{ width: '100%', padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', fontSize: '14px', minHeight: '80px', marginBottom: '12px', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }} />
          {/* Image upload */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#6b7280', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = c('borderColor', '#e5e7eb'); e.currentTarget.style.color = '#6b7280'; }}>
                <ImagePlus size={16} /> Add Photo
                <input type="file" accept="image/*" onChange={handleReviewImageUpload} style={{ display: 'none' }} disabled={reviewImageUploading || reviewImages.length >= 5} />
              </label>
              {reviewImageUploading && <span style={{ fontSize: '12px', color: '#9ca3af' }}>Uploading...</span>}
              {reviewImages.length > 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{reviewImages.length}/5 photos</span>}
            </div>
            {reviewImages.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {reviewImages.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={url} alt={`Upload ${idx + 1}`} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <button type="button" onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={reviewSubmitting} style={{ padding: '12px 28px', background: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', opacity: reviewSubmitting ? 0.6 : 1, transition: 'all 0.2s' }} onMouseEnter={e => { if (!reviewSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { if (!reviewSubmitting) e.currentTarget.style.transform = 'translateY(0)'; }}>
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
                {item.image && <img src={item.image} alt={item.title} loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>{item.price} <SaudiRiyalSymbol size={11} color="#111" /></p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky mobile add-to-cart bar */}
      <div className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: '1px solid #e5e7eb',
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '11px', color: '#999', margin: 0, fontWeight: 600 }}>{t('price')}</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {currentPrice} <SaudiRiyalSymbol size={14} color="#111" />
          </p>
        </div>
        <button
          onClick={() => {
            if (product.hasVariants && product.variants?.length > 0 && !selectedVariant) {
              setMobileSheetOpen(true);
            } else {
              handleAddToCart();
            }
          }}
          style={{
            flex: '1 1 160px', padding: '14px 24px', background: added ? '#059669' : '#111',
            color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            minHeight: '48px', transition: 'all 0.2s',
          }}
        >
          {added ? <><Check size={18} /> {t('added')}</> : <><ShoppingCart size={18} /> {t('addToCart')}</>}
        </button>
      </div>

      {/* Mobile BottomSheet for variant selection */}
      <BottomSheet
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={t('options') || 'Options'}
        colors={data?.colors}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {product.variants?.filter(v => v.isActive).map(v => {
            const outOfStock = v.trackInventory && v.stockQuantity <= 0;
            return (
              <button
                key={v._id}
                onClick={() => { setSelectedVariant(v._id); setMobileSheetOpen(false); }}
                disabled={outOfStock}
                style={{
                  padding: '14px 18px', borderRadius: '14px',
                  border: selectedVariant === v._id ? '2px solid #111' : '1px solid #e5e7eb',
                  background: selectedVariant === v._id ? '#f9fafb' : '#fff',
                  cursor: outOfStock ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600,
                  opacity: outOfStock ? 0.35 : 1, textAlign: isRTL ? 'right' : 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  minHeight: '48px',
                }}
              >
                <span>{[v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ')}</span>
                <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {v.price || product.basePrice} <SaudiRiyalSymbol size={12} color="#111" />
                </span>
              </button>
            );
          })}
          {selectedVariant && (
            <button
              onClick={() => { handleAddToCart(); setMobileSheetOpen(false); }}
              style={{
                marginTop: '8px', padding: '16px', background: '#111', color: '#fff',
                border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                minHeight: '52px',
              }}
            >
              <ShoppingCart size={18} /> {t('addToCart')}
            </button>
          )}
        </div>
      </BottomSheet>

    </div>
  );
}

// Frequently Bought Together item card
function FBTItem({ product, checked, alwaysChecked, onToggle }) {
  const slug = product.seo?.slug || product._id;
  return (
    <div style={{ minWidth: '160px', flexShrink: 0, textAlign: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <Link to={`/store/products/${slug}`}>
          <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', border: '1px solid #e5e7eb', opacity: checked ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            {product.images?.[0]?.url ? (
              <img src={optimizeImageUrl(product.images[0].url, { width: 200, quality: 80 })} alt={product.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                <Package size={24} color="#9ca3af" />
              </div>
            )}
          </div>
        </Link>
        {!alwaysChecked && (
          <button
            onClick={onToggle}
            style={{
              position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)',
              width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #fff',
              background: checked ? '#4f46e5' : '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 1,
            }}
          >
            {checked && <Check size={14} color="#fff" />}
          </button>
        )}
      </div>
      <Link to={`/store/products/${slug}`} style={{ textDecoration: 'none' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{product.title}</p>
      </Link>
      <p style={{ fontSize: '14px', fontWeight: 800, color: '#111', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
        {product.basePrice} <SaudiRiyalSymbol size={11} color="#111" />
      </p>
    </div>
  );
}
