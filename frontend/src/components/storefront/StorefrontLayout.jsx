import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, X, Menu, Instagram, Twitter, Facebook, Heart, Mail, Phone, MapPin, Send, ShieldCheck, Truck, CreditCard, RotateCcw, ChevronDown, LayoutGrid, Tag } from 'lucide-react';
import SaudiRiyalSymbol from './SaudiRiyalSymbol';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';
import MiniCartPreview from './MiniCartPreview';
import CookieConsent from './CookieConsent';
import MobileBottomNav from './MobileBottomNav';
import BackToTop from './BackToTop';
import AbandonedCartReminder from './AbandonedCartReminder';
import NewsletterPopup from './NewsletterPopup';
import { ToastProvider, ScrollToTop, StorefrontGlobalStyles } from './StorefrontUi';

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
  const [categories, setCategories] = useState([]);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const megaMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, isOpen, setIsOpen } = useCart();
  const { lang, toggleLang, t, isRTL } = useI18n();

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
    storeApi.get('/products?limit=100').then(res => {
      const cats = [...new Set(res.data.products.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    }).catch(() => {});
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
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) setMegaMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <ToastProvider>
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: c('background', '#ffffff'), color: c('text', '#111827'), minHeight: '100vh', fontFamily: isRTL ? "'Tajawal', 'Cairo', 'Noto Sans Arabic', sans-serif" : (theme.typography?.bodyFont || 'Inter, sans-serif'), overflowX: 'clip' }}>
      <StorefrontGlobalStyles />
      <ScrollToTop />
      {/* Announcement bar */}
      {header.announcementBar?.enabled && (
        <div style={{ backgroundColor: header.announcementBar.bgColor || c('primary', '#4f46e5'), color: header.announcementBar.textColor || '#fff', padding: '8px', textAlign: 'center', fontSize: '13px' }}>
          {header.announcementBar.text}
        </div>
      )}

      {/* Header — ultra premium minimalistic */}
      <header style={{
        backgroundColor: c('headerBg', '#ffffff'),
        borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`,
        position: header.sticky ? 'sticky' : 'static', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: header.sticky ? `${c('headerBg', '#ffffff')}f2` : c('headerBg', '#ffffff'),
        transition: 'box-shadow 0.3s ease, background 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Logo — Maqder */}
          <Link to="/store" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {header.logoImageUrl ? (
              <img src={header.logoImageUrl} alt="logo" style={{ height: '34px' }} />
            ) : (
              <>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${c('primary', '#059669')}, ${c('primary', '#059669')}dd)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7h18M3 12h18M3 17h12" />
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: '20px', color: c('text', '#111827'), letterSpacing: '-0.5px' }}>
                  {header.logoText || storeInfo?.storeName || 'Maqder'}
                </span>
              </>
            )}
          </Link>

          {/* Search */}
          {header.showSearch !== false && (
            <div ref={searchRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }} className="hidden md:block">
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  style={{ flex: 1, padding: '10px 16px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: isRTL ? '0 10px 10px 0' : '10px 0 0 10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: c('surface', '#f9fafb') }}
                />
                <button type="submit" style={{ padding: '10px 18px', backgroundColor: c('primary', '#059669'), color: '#fff', border: 'none', borderRadius: isRTL ? '10px 0 0 10px' : '0 10px 10px 0', cursor: 'pointer', transition: 'opacity 0.2s' }}
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
                          <p style={{ fontSize: '12px', color: c('priceColor', '#059669'), fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>{p.basePrice} <SaudiRiyalSymbol size={10} color={c('priceColor', '#059669')} /></p>
                        </div>
                      </Link>
                    );
                  })}
                  <Link to={`/store/products?search=${encodeURIComponent(searchQuery)}`} onClick={() => setShowSuggestions(false)}
                    style={{ display: 'block', padding: '10px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: c('primary', '#4f46e5'), textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {t('seeAllResults')} →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {header.showCategories !== false && (
              <div ref={megaMenuRef} className="hidden md:block" style={{ position: 'relative' }}>
                <button
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  style={{ color: megaMenuOpen ? c('primary', '#4f46e5') : c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {t('products')}
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: megaMenuOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {megaMenuOpen && (
                  <div
                    onMouseLeave={() => setMegaMenuOpen(false)}
                    style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px',
                      background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '16px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.12)', zIndex: 200, padding: '20px', minWidth: '320px',
                      animation: 'sf-toast-in 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <Link to="/store/products" onClick={() => setMegaMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: c('text', '#111'), fontSize: '14px', fontWeight: 600, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LayoutGrid size={16} style={{ color: c('primary', '#4f46e5') }} /> {t('allProducts')}
                      </Link>
                      {categories.slice(0, 7).map(cat => (
                        <Link key={cat} to={`/store/products?category=${encodeURIComponent(cat)}`} onClick={() => setMegaMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', color: c('text', '#111'), fontSize: '14px', fontWeight: 600, transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Tag size={16} style={{ color: c('primary', '#4f46e5') }} /> {cat}
                        </Link>
                      ))}
                    </div>
                    <Link to="/store/products" onClick={() => setMegaMenuOpen(false)}
                      style={{ display: 'block', marginTop: '12px', padding: '10px', textAlign: 'center', borderRadius: '10px', background: `${c('primary', '#4f46e5')}0d`, color: c('primary', '#4f46e5'), textDecoration: 'none', fontSize: '13px', fontWeight: 700, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${c('primary', '#4f46e5')}14`}
                      onMouseLeave={e => e.currentTarget.style.background = `${c('primary', '#4f46e5')}0d`}
                    >
                      {t('browseAllProducts')} →
                    </Link>
                  </div>
                )}
              </div>
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
                    <span key={cartCount} className="sf-cart-bounce" style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: c('primary', '#059669'), color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '999px', padding: '2px 6px', minWidth: '18px', textAlign: 'center', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
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
              <input type="text" placeholder={t('search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '8px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', fontSize: '14px' }} />
            </form>
            <Link to="/store/products" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '8px 0', color: c('text', '#111827'), textDecoration: 'none' }}>{t('allProducts')}</Link>
          </div>
        )}
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Trust badges bar — minimal */}
      <div style={{ borderTop: `1px solid ${c('borderColor', '#e5e7eb')}`, background: c('background', '#ffffff'), marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
          {[
            { icon: Truck, title: t('freeShipping'), sub: t('freeShippingSub') },
            { icon: ShieldCheck, title: t('securePayment'), sub: t('securePaymentSub') },
            { icon: RotateCcw, title: t('easyReturns'), sub: t('easyReturnsSub') },
            { icon: Phone, title: t('dedicatedSupport'), sub: t('dedicatedSupportSub') },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <b.icon size={18} style={{ color: c('primary', '#059669'), flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: c('text', '#111827') }}>{b.title}</p>
                <p style={{ margin: 0, fontSize: '11px', color: c('textMuted', '#9ca3af') }}>{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — ultra premium minimalistic */}
      <footer style={{ background: '#fff', borderTop: `1px solid ${c('borderColor', '#e5e7eb')}`, marginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 20px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px' }} className="sf-footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                {header.logoImageUrl ? (
                  <img src={header.logoImageUrl} alt="logo" style={{ height: '32px' }} />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: '20px', color: c('text', '#111'), letterSpacing: '-0.5px' }}>
                    {header.logoText || storeInfo?.storeName || 'Store'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.8, color: c('textMuted', '#6b7280'), margin: '0 0 24px', maxWidth: '280px' }}>
                {footer.aboutText || 'Premium products, delivered with excellence across the Kingdom.'}
              </p>
              {/* Social — minimal */}
              {footer.showSocialLinks !== false && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { url: footer.socialLinks?.instagram, Icon: Instagram },
                    { url: footer.socialLinks?.twitter, Icon: Twitter },
                    { url: footer.socialLinks?.facebook, Icon: Facebook },
                  ].filter(s => s.url).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener" style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${c('borderColor', '#e5e7eb')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c('textMuted', '#6b7280'), textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = c('text', '#111'); e.currentTarget.style.color = c('text', '#111'); }} onMouseLeave={e => { e.currentTarget.style.borderColor = c('borderColor', '#e5e7eb'); e.currentTarget.style.color = c('textMuted', '#6b7280'); }}>
                      <s.Icon size={15} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Shop */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c('text', '#111'), margin: '0 0 16px' }}>{t('shop')}</h4>
              {[
                { to: '/store', label: t('home') },
                { to: '/store/products', label: t('allProducts') },
                { to: '/store/wishlist', label: t('wishlist') },
                { to: '/store/compare', label: t('compare') },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ display: 'block', color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '13px', marginBottom: '8px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = c('text', '#111')}
                  onMouseLeave={e => e.currentTarget.style.color = c('textMuted', '#6b7280')}
                >{link.label}</Link>
              ))}
            </div>

            {/* Help */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c('text', '#111'), margin: '0 0 16px' }}>{t('help')}</h4>
              {[
                { to: '/store/track-order', label: t('trackOrder') },
                { to: '/store/returns', label: t('returnsRefunds') },
                { to: '/store/shipping-policy', label: t('shippingPolicy') },
                { to: '/store/faq', label: t('faq') },
                { to: '/store/contact', label: t('contactUs') },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{ display: 'block', color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '13px', marginBottom: '8px', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = c('text', '#111')}
                  onMouseLeave={e => e.currentTarget.style.color = c('textMuted', '#6b7280')}
                >{link.label}</Link>
              ))}
            </div>

            {/* Contact + Newsletter */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: c('text', '#111'), margin: '0 0 16px' }}>{t('getInTouch')}</h4>
              {footer.contactEmail && (
                <a href={`mailto:${footer.contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '13px', marginBottom: '8px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = c('text', '#111')} onMouseLeave={e => e.currentTarget.style.color = c('textMuted', '#6b7280')}>
                  <Mail size={14} style={{ flexShrink: 0 }} /> {footer.contactEmail}
                </a>
              )}
              {footer.contactPhone && (
                <a href={`tel:${footer.contactPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '13px', marginBottom: '8px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = c('text', '#111')} onMouseLeave={e => e.currentTarget.style.color = c('textMuted', '#6b7280')}>
                  <Phone size={14} style={{ flexShrink: 0 }} /> {footer.contactPhone}
                </a>
              )}
              {/* Newsletter — minimal */}
              <form onSubmit={e => { e.preventDefault(); const email = e.target.email.value; if (email) { storeApi.post('/newsletter/subscribe', { email }).catch(() => {}); e.target.reset(); setNewsletterDone(true); setTimeout(() => setNewsletterDone(false), 3000); } }} style={{ display: 'flex', gap: '0', marginTop: '16px', borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
                <input name="email" type="email" required placeholder={t('yourEmail')} style={{ flex: 1, minWidth: 0, padding: '10px 0', border: 'none', background: 'none', color: c('text', '#111'), fontSize: '13px', outline: 'none' }} />
                <button type="submit" style={{ flexShrink: 0, padding: '10px 0 10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111'), transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.6'} onMouseLeave={e => e.currentTarget.style.opacity = '1'} title={t('subscribe')}>
                  <Send size={16} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                </button>
              </form>
              {newsletterDone && <p style={{ fontSize: '12px', color: '#059669', margin: '8px 0 0', fontWeight: 600 }}>✓ {t('thanksSubscribing')}</p>}
            </div>
          </div>
        </div>

        {/* Bottom bar — minimal */}
        <div style={{ borderTop: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ fontSize: '12px', margin: 0, color: c('textMuted', '#9ca3af') }}>
              {footer.copyrightText || `© ${new Date().getFullYear()} ${storeInfo?.storeName || header.logoText || 'Store'}. All rights reserved.`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {['VISA', 'MC', 'MADA'].map(p => (
                <span key={p} style={{ display: 'inline-flex', alignItems: 'center', height: '22px', padding: '0 7px', borderRadius: '4px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, color: c('textMuted', '#6b7280'), fontSize: '9px', fontWeight: 700, letterSpacing: '0.3px' }}>{p}</span>
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
    </ToastProvider>
  );
}
