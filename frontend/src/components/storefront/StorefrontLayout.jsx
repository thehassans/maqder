import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, X, Menu, Instagram, Twitter, Facebook, Heart, Mail, Phone, MapPin, Send, ShieldCheck, Truck, CreditCard, RotateCcw } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';
import MiniCartPreview from './MiniCartPreview';
import CookieConsent from './CookieConsent';
import MobileBottomNav from './MobileBottomNav';
import BackToTop from './BackToTop';
import AbandonedCartReminder from './AbandonedCartReminder';
import NewsletterPopup from './NewsletterPopup';

// Inject pixel scripts into <head> based on store config
function injectPixelScripts(pixels) {
  if (!pixels) return;
  const existing = document.getElementById('maqder-pixel-scripts');
  if (existing) return; // already injected

  let html = '';
  // Google Analytics 4
  if (pixels.googleAnalytics?.enabled && pixels.googleAnalytics?.measurementId) {
    const id = pixels.googleAnalytics.measurementId;
    html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`;
    html += `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
  }
  // Facebook Pixel
  if (pixels.facebookPixel?.enabled && pixels.facebookPixel?.pixelId) {
    const id = pixels.facebookPixel.pixelId;
    html += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');</script>`;
  }
  // TikTok Pixel
  if (pixels.tiktokPixel?.enabled && pixels.tiktokPixel?.pixelId) {
    const id = pixels.tiktokPixel.pixelId;
    html += `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id}');ttq.page();</script>`;
  }
  // Snapchat Pixel
  if (pixels.snapchatPixel?.enabled && pixels.snapchatPixel?.pixelId) {
    const id = pixels.snapchatPixel.pixelId;
    html += `<script>(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${id}');snaptr('track','PAGE_VIEW');</script>`;
  }
  // Twitter Pixel
  if (pixels.twitterPixel?.enabled && pixels.twitterPixel?.pixelId) {
    const id = pixels.twitterPixel.pixelId;
    html += `<script>!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('init','${id}');twq('track','PageView');</script>`;
  }
  // Google Ads
  if (pixels.googleAds?.enabled && pixels.googleAds?.conversionId) {
    const cid = pixels.googleAds.conversionId;
    html += `<script async src="https://www.googletagmanager.com/gtag/js?id=${cid}"></script>`;
    html += `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${cid}');</script>`;
  }

  if (html) {
    const container = document.createElement('div');
    container.id = 'maqder-pixel-scripts';
    container.innerHTML = html;
    document.head.appendChild(container);
  }
}

// Fire a pixel event to all loaded pixels with proper per-platform event name mapping
const PIXEL_EVENT_MAP = {
  PageView: { fb: 'PageView', tt: 'PageView', snap: 'PAGE_VIEW', tw: 'PageView', ga: 'page_view' },
  ViewContent: { fb: 'ViewContent', tt: 'ViewContent', snap: 'VIEW_CONTENT', tw: 'ViewContent', ga: 'view_item' },
  AddToCart: { fb: 'AddToCart', tt: 'AddToCart', snap: 'ADD_CART', tw: 'AddToCart', ga: 'add_to_cart' },
  InitiateCheckout: { fb: 'InitiateCheckout', tt: 'InitiateCheckout', snap: 'START_CHECKOUT', tw: 'InitiateCheckout', ga: 'begin_checkout' },
  AddPaymentInfo: { fb: 'AddPaymentInfo', tt: 'AddPaymentInfo', snap: 'ADD_BILLING', tw: 'AddPaymentInfo', ga: 'add_payment_info' },
  Purchase: { fb: 'Purchase', tt: 'CompletePayment', snap: 'PURCHASE', tw: 'Purchase', ga: 'purchase' },
  Search: { fb: 'Search', tt: 'Search', snap: 'SEARCH', tw: 'Search', ga: 'search' },
  AddToWishlist: { fb: 'AddToWishlist', tt: 'AddToWishlist', snap: 'ADD_TO_WISHLIST', tw: 'AddToWishlist', ga: 'add_to_wishlist' },
  Lead: { fb: 'Lead', tt: 'SubmitForm', snap: 'SIGN_UP', tw: 'Lead', ga: 'generate_lead' },
  CompleteRegistration: { fb: 'CompleteRegistration', tt: 'CompleteRegistration', snap: 'SIGN_UP', tw: 'CompleteRegistration', ga: 'sign_up' },
};

const firedEvents = new Set();

export function firePixelEvent(event, params) {
  if (typeof window === 'undefined') return;
  const p = params || {};
  const mapping = PIXEL_EVENT_MAP[event] || { fb: event, tt: event, snap: event.toUpperCase(), tw: event, ga: event };

  // Deduplicate Purchase events per order
  if (event === 'Purchase' && p.order_id) {
    const dedupKey = `Purchase:${p.order_id}`;
    if (firedEvents.has(dedupKey)) return;
    firedEvents.add(dedupKey);
  }

  // Facebook Pixel
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', mapping.fb, p);
  }

  // TikTok Pixel
  if (typeof window.ttq !== 'undefined') {
    window.ttq.track(mapping.tt, p);
  }

  // Snapchat Pixel
  if (typeof window.snaptr !== 'undefined') {
    window.snaptr('track', mapping.snap, p);
  }

  // Twitter Pixel
  if (typeof window.twq !== 'undefined') {
    window.twq('track', mapping.tw, p);
  }

  // Google Analytics 4
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', mapping.ga, p);
  }

  // Google Ads conversion tracking on Purchase
  if (event === 'Purchase' && typeof window.gtag !== 'undefined') {
    const gaAds = window.__maqderPixels?.googleAds;
    if (gaAds?.enabled && gaAds?.conversionId && gaAds?.conversionLabel) {
      window.gtag('event', 'conversion', {
        send_to: `${gaAds.conversionId}/${gaAds.conversionLabel}`,
        value: p.value || 0,
        currency: p.currency || 'SAR',
        transaction_id: p.order_id || '',
      });
    }
  }
}

// Store pixel config globally for Google Ads conversion tracking
export function setPixelConfig(pixels) {
  if (typeof window !== 'undefined') {
    window.__maqderPixels = pixels;
  }
}

export default function StorefrontLayout({ children }) {
  const [storeInfo, setStoreInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { items, cartCount, cartTotal, isOpen, setIsOpen, removeItem } = useCart();
  const { lang, toggleLang, t, isRTL } = useI18n();

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  // Inject pixel scripts when store info loads
  useEffect(() => {
    if (storeInfo?.pixels) {
      injectPixelScripts(storeInfo.pixels);
      setPixelConfig(storeInfo.pixels);
    }
  }, [storeInfo]);

  // Fire PageView on route change
  useEffect(() => {
    if (storeInfo?.pixels) {
      firePixelEvent('PageView', { page_path: location.pathname });
    }
  }, [location.pathname, storeInfo]);

  const theme = storeInfo?.theme || {};
  const colors = theme.colors || {};
  const header = theme.header || {};
  const footer = theme.footer || {};
  const c = (key, fallback) => colors[key] || fallback;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      firePixelEvent('Search', { search_string: searchQuery.trim() });
      navigate(`/store/products?search=${encodeURIComponent(searchQuery)}`);
    }
    setShowSuggestions(false);
  };

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await storeApi.get(`/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
        setSuggestions(res.data.products || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ backgroundColor: c('background', '#ffffff'), color: c('text', '#111827'), minHeight: '100vh', fontFamily: theme.typography?.bodyFont || 'Inter, sans-serif', overflowX: 'clip' }}>
      {/* Announcement bar */}
      {header.announcementBar?.enabled && (
        <div style={{ backgroundColor: header.announcementBar.bgColor || c('primary', '#4f46e5'), color: header.announcementBar.textColor || '#fff', padding: '8px', textAlign: 'center', fontSize: '13px' }}>
          {header.announcementBar.text}
        </div>
      )}

      {/* Header */}
      <header style={{
        backgroundColor: c('headerBg', '#ffffff'),
        borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`,
        position: header.sticky ? 'sticky' : 'static', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: header.sticky ? `${c('headerBg', '#ffffff')}f2` : c('headerBg', '#ffffff'),
        transition: 'box-shadow 0.3s ease, background 0.3s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Logo */}
          <Link to="/store" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {header.logoImageUrl ? (
              <img src={header.logoImageUrl} alt="logo" style={{ height: '36px' }} />
            ) : (
              <span style={{ fontWeight: 800, fontSize: '22px', color: c('text', '#111827'), letterSpacing: '-0.5px' }}>
                {header.logoText || storeInfo?.storeName || 'Store'}
              </span>
            )}
          </Link>

          {/* Search */}
          {header.showSearch !== false && (
            <div ref={searchRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }} className="hidden md:block">
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  style={{ flex: 1, padding: '10px 14px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px 0 0 10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                />
                <button type="submit" style={{ padding: '10px 18px', backgroundColor: c('primary', '#4f46e5'), color: '#fff', border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Search size={16} />
                </button>
              </form>
              {/* Search suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                  background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '14px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                }}>
                  {suggestions.map(p => {
                    const slug = p.seo?.slug || p._id;
                    return (
                      <Link key={p._id} to={`/store/products/${slug}`} onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                          {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: c('text', '#111'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          <p style={{ fontSize: '12px', color: c('priceColor', '#059669'), fontWeight: 700, margin: 0 }}>{p.basePrice} {storeInfo?.currency || 'SAR'}</p>
                        </div>
                      </Link>
                    );
                  })}
                  <Link to={`/store/products?search=${encodeURIComponent(searchQuery)}`} onClick={() => setShowSuggestions(false)}
                    style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: c('primary', '#4f46e5'), textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    See all results →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {header.showCategories !== false && (
              <Link to="/store/products" style={{ color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.2s' }} className="hidden md:inline"
                onMouseEnter={e => e.currentTarget.style.color = c('primary', '#4f46e5')}
                onMouseLeave={e => e.currentTarget.style.color = c('textMuted', '#6b7280')}
              >{t('products')}</Link>
            )}
            {/* Language toggle */}
            <button onClick={toggleLang} style={{ background: 'none', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '10px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: c('text', '#111827'), transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c('primary', '#4f46e5'); e.currentTarget.style.color = c('primary', '#4f46e5'); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c('borderColor', '#e5e7eb'); e.currentTarget.style.color = c('text', '#111827'); }}
            >
              {lang === 'en' ? 'العربية' : 'EN'}
            </button>
            {header.showCart !== false && (
              <>
                <Link to="/store/wishlist" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111827'), textDecoration: 'none', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Heart size={22} />
                </Link>
                <button onClick={() => setIsOpen(true)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111827'), transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: c('primary', '#4f46e5'), color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '999px', padding: '2px 6px', minWidth: '18px', textAlign: 'center', boxShadow: '0 2px 8px rgba(79,70,229,0.3)' }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111827') }}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${c('borderColor', '#e5e7eb')}` }} className="md:hidden">
            <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: '12px' }}>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '8px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', fontSize: '14px' }} />
            </form>
            <Link to="/store/products" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '8px 0', color: c('text', '#111827'), textDecoration: 'none' }}>All Products</Link>
          </div>
        )}
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Cart drawer */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setIsOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', transition: 'opacity 0.3s' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '420px', backgroundColor: c('background', '#fff'), boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, fontSize: '20px', margin: 0, letterSpacing: '-0.3px' }}>Cart ({cartCount})</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <ShoppingCart size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
                  <p style={{ color: c('textMuted', '#6b7280'), fontSize: '15px', fontWeight: 600 }}>Your cart is empty</p>
                  <Link to="/store/products" onClick={() => setIsOpen(false)} style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: c('primary', '#4f46e5'), color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Browse Products</Link>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.key} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
                    {item.image && <img src={item.image} alt={item.title} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>{item.title}</p>
                      {item.variantLabel && <p style={{ fontSize: '12px', color: c('textMuted', '#6b7280'), margin: '0 0 4px' }}>{item.variantLabel}</p>}
                      <p style={{ fontSize: '14px', color: c('priceColor', '#059669'), fontWeight: 700, margin: 0 }}>{item.price} {storeInfo?.currency || 'SAR'} × {item.quantity}</p>
                    </div>
                    <button onClick={() => removeItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}><X size={16} /></button>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: c('primary', '#4f46e5') }}>{cartTotal} {storeInfo?.currency || 'SAR'}</span>
                </div>
                <Link to="/store/checkout" onClick={() => setIsOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '14px', backgroundColor: c('buttonBg', '#4f46e5'), color: c('buttonText', '#fff'), borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '15px', transition: 'opacity 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.2)' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Checkout →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust badges bar */}
      <div style={{ borderTop: `1px solid ${c('borderColor', '#e5e7eb')}`, background: c('background', '#ffffff'), marginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { icon: Truck, title: 'Free Shipping', sub: 'On orders over 200 SAR' },
            { icon: ShieldCheck, title: 'Secure Payment', sub: '100% protected checkout' },
            { icon: RotateCcw, title: 'Easy Returns', sub: '7-day return policy' },
            { icon: Phone, title: 'Dedicated Support', sub: 'We\'re here to help' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c('primary', '#4f46e5')}14`, color: c('primary', '#4f46e5') }}>
                <b.icon size={22} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: c('text', '#111827') }}>{b.title}</p>
                <p style={{ margin: 0, fontSize: '12px', color: c('textMuted', '#6b7280') }}>{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: 'linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%)', color: 'rgba(255,255,255,0.62)', position: 'relative' }}>
        {/* Accent top border */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${c('primary', '#4f46e5')}, ${c('accent', '#7c3aed')}, ${c('primary', '#4f46e5')})` }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 20px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px' }}>
          {/* Brand + newsletter */}
          <div style={{ maxWidth: '320px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 14px', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>{storeInfo?.storeName || header.logoText || 'Store'}</h4>
            <p style={{ fontSize: '13px', lineHeight: 1.7, margin: '0 0 20px' }}>{footer.aboutText || 'Your one-stop destination for premium quality products, delivered fast across the Kingdom.'}</p>

            {/* Newsletter */}
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 700, margin: '0 0 10px' }}>Subscribe for exclusive offers</p>
            <form onSubmit={e => { e.preventDefault(); const email = e.target.email.value; if (email) { storeApi.post('/newsletter/subscribe', { email }).catch(() => {}); e.target.reset(); setNewsletterDone(true); setTimeout(() => setNewsletterDone(false), 3000); } }} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input name="email" type="email" required placeholder="Your email" style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.currentTarget.style.borderColor = c('primary', '#4f46e5')} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'} />
              <button type="submit" style={{ flexShrink: 0, width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: 'none', cursor: 'pointer', color: '#fff', background: `linear-gradient(135deg, ${c('primary', '#4f46e5')}, ${c('accent', '#6366f1')})`, transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }} title="Subscribe">
                <Send size={18} />
              </button>
            </form>
            {newsletterDone && <p style={{ fontSize: '12px', color: '#34d399', margin: '-12px 0 16px', fontWeight: 600 }}>✓ Thanks for subscribing!</p>}

            {/* Social */}
            {footer.showSocialLinks !== false && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { url: footer.socialLinks?.instagram, Icon: Instagram },
                  { url: footer.socialLinks?.twitter, Icon: Twitter },
                  { url: footer.socialLinks?.facebook, Icon: Facebook },
                ].filter(s => s.url).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener" style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = c('primary', '#4f46e5'); e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-3px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'translateY(0)'; }}><s.Icon size={17} /></a>
                ))}
              </div>
            )}
          </div>

          {/* Shop links */}
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Shop</h4>
            {[
              { to: '/store', label: 'Home' },
              { to: '/store/products', label: 'All Products' },
              { to: '/store/wishlist', label: 'Wishlist' },
              { to: '/store/compare', label: 'Compare' },
              { to: '/store/account', label: 'My Account' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13.5px', marginBottom: '10px', transition: 'color 0.2s, padding-left 0.2s', width: 'fit-content' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.paddingLeft = '0'; }}
              >{link.label}</Link>
            ))}
          </div>

          {/* Help links */}
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Help</h4>
            {[
              { to: '/store/track-order', label: 'Track Order' },
              { to: '/store/returns', label: 'Returns & Refunds' },
              { to: '/store/shipping-policy', label: 'Shipping Policy' },
              { to: '/store/faq', label: 'FAQ' },
              { to: '/store/contact', label: 'Contact Us' },
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13.5px', marginBottom: '10px', transition: 'color 0.2s, padding-left 0.2s', width: 'fit-content' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.paddingLeft = '5px'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.paddingLeft = '0'; }}
              >{link.label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Get in Touch</h4>
            {footer.contactEmail && (
              <a href={`mailto:${footer.contactEmail}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13.5px', marginBottom: '12px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                <Mail size={16} style={{ marginTop: '2px', flexShrink: 0, color: c('primary', '#818cf8') }} /> {footer.contactEmail}
              </a>
            )}
            {footer.contactPhone && (
              <a href={`tel:${footer.contactPhone}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13.5px', marginBottom: '12px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                <Phone size={16} style={{ marginTop: '2px', flexShrink: 0, color: c('primary', '#818cf8') }} /> {footer.contactPhone}
              </a>
            )}
            {footer.contactAddress && (
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', margin: '0 0 12px', lineHeight: 1.6 }}>
                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0, color: c('primary', '#818cf8') }} /> {footer.contactAddress}
              </p>
            )}
            {!footer.contactEmail && !footer.contactPhone && !footer.contactAddress && (
              <Link to="/store/contact" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13.5px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                <Mail size={16} style={{ flexShrink: 0, color: c('primary', '#818cf8') }} /> Contact our support team
              </Link>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <p style={{ fontSize: '12.5px', margin: 0, color: 'rgba(255,255,255,0.5)' }}>
              {footer.copyrightText || `© ${new Date().getFullYear()} ${storeInfo?.storeName || header.logoText || 'Store'}. All rights reserved.`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginRight: '4px' }}>We accept</span>
              {['VISA', 'MC', 'MADA', 'AMEX'].map(p => (
                <span key={p} style={{ display: 'inline-flex', alignItems: 'center', height: '26px', padding: '0 9px', borderRadius: '6px', background: 'rgba(255,255,255,0.92)', color: '#1a1f2e', fontSize: '10px', fontWeight: 800, letterSpacing: '0.3px' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Mini-cart drawer */}
      <MiniCartPreview />

      {/* Cookie consent banner */}
      <CookieConsent />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Back to top button */}
      <BackToTop />

      {/* Abandoned cart reminder */}
      <AbandonedCartReminder />

      {/* Newsletter exit-intent popup */}
      <NewsletterPopup />

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden" style={{ height: '60px' }} />
    </div>
  );
}
