import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Check, Minus, Plus, Eye } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';

export default function QuickViewModal({ product, onClose, currency = 'SAR' }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (product?.variants?.length > 0) {
      const firstActive = product.variants.find(v => v.isActive && (!v.trackInventory || v.stockQuantity > 0));
      setSelectedVariant(firstActive?._id || null);
    }
    setQuantity(1);
    setAdded(false);
  }, [product]);

  if (!product) return null;

  const slug = product.seo?.slug || product._id;
  const variant = product.variants?.find(v => v._id === selectedVariant);
  const currentPrice = variant?.price || product.basePrice;
  const outOfStock = variant?.trackInventory ? variant.stockQuantity <= 0 : product.trackInventory ? product.stockQuantity <= 0 : false;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem({
      productId: product._id,
      title: product.title,
      price: currentPrice,
      image: product.images?.[0]?.url,
      quantity,
      variantId: selectedVariant,
      variantLabel: variant ? [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' / ') : '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 300,
        background: '#fff', borderRadius: '24px', maxWidth: '700px', width: '90vw', maxHeight: '85vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 1,
          width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', overflow: 'auto' }}>
          {/* Image */}
          <div style={{ width: '300px', flexShrink: 0, background: '#f3f4f6' }}>
            {product.images?.[0]?.url ? (
              <img src={product.images[0].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '300px' }} />
            ) : (
              <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>No image</div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, padding: '28px', minWidth: 0 }}>
            {product.category && <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>{product.category}</p>}
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.3px' }}>{product.title}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                <span style={{ fontSize: '15px', color: '#dc2626', textDecoration: 'line-through' }}>{product.compareAtPrice} {currency}</span>
              )}
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{currentPrice} {currency}</span>
            </div>

            {product.shortDescription && (
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.shortDescription}
              </p>
            )}

            {/* Variants */}
            {product.hasVariants && product.variants?.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>Options:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.variants.filter(v => v.isActive).map(v => {
                    const vOutOfStock = v.trackInventory && v.stockQuantity <= 0;
                    return (
                      <button key={v._id} onClick={() => setSelectedVariant(v._id)} disabled={vOutOfStock} style={{
                        padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: vOutOfStock ? 'not-allowed' : 'pointer',
                        border: selectedVariant === v._id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                        background: selectedVariant === v._id ? '#eef2ff' : '#fff',
                        opacity: vOutOfStock ? 0.4 : 1, transition: 'all 0.2s',
                      }}>
                        {[v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status */}
            {outOfStock && <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, marginBottom: '14px' }}>Out of stock</p>}

            {/* Quantity + Add to cart */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={14} /></button>
                <span style={{ padding: '0 14px', fontWeight: 700, fontSize: '14px' }}>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={14} /></button>
              </div>
              <button onClick={handleAddToCart} disabled={outOfStock} style={{
                flex: 1, padding: '12px 18px', background: added ? '#059669' : 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: '14px',
                fontWeight: 700, fontSize: '14px', cursor: outOfStock ? 'not-allowed' : 'pointer', opacity: outOfStock ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s',
                boxShadow: added ? 'none' : '0 4px 14px rgba(79,70,229,0.25)',
              }} onMouseEnter={e => { if (!outOfStock && !added) e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {added ? <><Check size={16} /> Added!</> : <><ShoppingCart size={16} /> Add to Cart</>}
              </button>
            </div>

            {/* View full details link */}
            <Link to={`/store/products/${slug}`} onClick={onClose} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: '14px', transition: 'gap 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.gap = '10px'} onMouseLeave={e => e.currentTarget.style.gap = '6px'}>
              <Eye size={16} /> View full details
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
