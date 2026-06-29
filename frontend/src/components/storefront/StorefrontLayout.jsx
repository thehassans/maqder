import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, X, Menu, Instagram, Twitter, Facebook, Heart } from 'lucide-react';
import storeApi from '../../lib/storeApi';
import { useCart } from '../../store/storefrontCart';
import { useI18n } from '../../store/storefrontI18n';
import MiniCartPreview from './MiniCartPreview';
import CookieConsent from './CookieConsent';

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

// Fire a pixel event to all loaded pixels
export function firePixelEvent(event, params) {
  if (typeof window === 'undefined') return;
  const p = params || {};
  if (typeof window.fbq !== 'undefined') window.fbq('track', event, p);
  if (typeof window.ttq !== 'undefined') window.ttq.track(event, p);
  if (typeof window.snaptr !== 'undefined') window.snaptr('track', event.toUpperCase(), p);
  if (typeof window.twq !== 'undefined') window.twq('track', event, p);
  if (typeof window.gtag !== 'undefined') window.gtag('event', event, p);
}

export default function StorefrontLayout({ children }) {
  const [storeInfo, setStoreInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { items, cartCount, cartTotal, isOpen, setIsOpen, removeItem } = useCart();
  const { lang, toggleLang, t, isRTL } = useI18n();

  useEffect(() => {
    storeApi.get('/info').then(res => setStoreInfo(res.data)).catch(() => {});
  }, []);

  // Inject pixel scripts when store info loads
  useEffect(() => {
    if (storeInfo?.pixels) injectPixelScripts(storeInfo.pixels);
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
    if (searchQuery.trim()) navigate(`/store/products?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div style={{ backgroundColor: c('background', '#ffffff'), color: c('text', '#111827'), minHeight: '100vh', fontFamily: theme.typography?.bodyFont || 'Inter, sans-serif' }}>
      {/* Announcement bar */}
      {header.announcementBar?.enabled && (
        <div style={{ backgroundColor: header.announcementBar.bgColor || c('primary', '#4f46e5'), color: header.announcementBar.textColor || '#fff', padding: '8px', textAlign: 'center', fontSize: '13px' }}>
          {header.announcementBar.text}
        </div>
      )}

      {/* Header */}
      <header style={{ backgroundColor: c('headerBg', '#ffffff'), borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`, position: header.sticky ? 'sticky' : 'static', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Logo */}
          <Link to="/store" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {header.logoImageUrl ? (
              <img src={header.logoImageUrl} alt="logo" style={{ height: '36px' }} />
            ) : (
              <span style={{ fontWeight: 'bold', fontSize: '20px', color: c('text', '#111827') }}>
                {header.logoText || storeInfo?.storeName || 'Store'}
              </span>
            )}
          </Link>

          {/* Search */}
          {header.showSearch !== false && (
            <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', display: 'none', ['@media(min-width:768px)']: { display: 'flex' } }} className="hidden md:flex">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px 0 0 8px', fontSize: '14px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: c('primary', '#4f46e5'), color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}>
                <Search size={16} />
              </button>
            </form>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {header.showCategories !== false && (
              <Link to="/store/products" style={{ color: c('textMuted', '#6b7280'), textDecoration: 'none', fontSize: '14px' }} className="hidden md:inline">{t('products')}</Link>
            )}
            {/* Language toggle */}
            <button onClick={toggleLang} style={{ background: 'none', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: c('text', '#111827') }}>
              {lang === 'en' ? 'العربية' : 'EN'}
            </button>
            {header.showCart !== false && (
              <>
                <Link to="/store/wishlist" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111827'), textDecoration: 'none' }}>
                  <Heart size={22} />
                </Link>
                <button onClick={() => setIsOpen(true)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: c('text', '#111827') }}>
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: c('primary', '#4f46e5'), color: '#fff', fontSize: '11px', fontWeight: 'bold', borderRadius: '999px', padding: '2px 6px', minWidth: '18px', textAlign: 'center' }}>
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
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '400px', backgroundColor: c('background', '#fff'), boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>Cart ({cartCount})</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {items.length === 0 ? (
                <p style={{ textAlign: 'center', color: c('textMuted', '#6b7280'), padding: '40px 0' }}>Your cart is empty</p>
              ) : (
                items.map(item => (
                  <div key={item.key} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
                    {item.image && <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px' }}>{item.title}</p>
                      {item.variantLabel && <p style={{ fontSize: '12px', color: c('textMuted', '#6b7280'), margin: '0 0 4px' }}>{item.variantLabel}</p>}
                      <p style={{ fontSize: '14px', color: c('priceColor', '#059669'), fontWeight: 'bold', margin: 0 }}>{item.price} {storeInfo?.currency || 'SAR'} × {item.quantity}</p>
                    </div>
                    <button onClick={() => removeItem(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={16} /></button>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: `1px solid ${c('borderColor', '#e5e7eb')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold' }}>Total</span>
                  <span style={{ fontWeight: 'bold', color: c('primary', '#4f46e5') }}>{cartTotal} {storeInfo?.currency || 'SAR'}</span>
                </div>
                <Link to="/store/checkout" onClick={() => setIsOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '12px', backgroundColor: c('buttonBg', '#4f46e5'), color: c('buttonText', '#fff'), borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: c('footerBg', '#111827'), color: c('footerText', '#9ca3af'), padding: '32px 20px', marginTop: '60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '24px' }}>
          {footer.showAbout !== false && (
            <div style={{ maxWidth: '250px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '14px' }}>{storeInfo?.storeName || 'Store'}</h4>
              <p style={{ fontSize: '13px', lineHeight: 1.5 }}>{footer.aboutText || 'Your one-stop shop for quality products.'}</p>
            </div>
          )}
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '14px' }}>Quick Links</h4>
            <Link to="/store" style={{ display: 'block', color: c('footerText', '#9ca3af'), textDecoration: 'none', fontSize: '13px', marginBottom: '4px' }}>Home</Link>
            <Link to="/store/products" style={{ display: 'block', color: c('footerText', '#9ca3af'), textDecoration: 'none', fontSize: '13px', marginBottom: '4px' }}>All Products</Link>
            <Link to="/store/wishlist" style={{ display: 'block', color: c('footerText', '#9ca3af'), textDecoration: 'none', fontSize: '13px', marginBottom: '4px' }}>Wishlist</Link>
            <Link to="/store/track-order" style={{ display: 'block', color: c('footerText', '#9ca3af'), textDecoration: 'none', fontSize: '13px', marginBottom: '4px' }}>Track Order</Link>
          </div>
          {footer.showContact !== false && (
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '14px' }}>Contact</h4>
              <p style={{ fontSize: '13px' }}>Email: info@store.com</p>
            </div>
          )}
          {footer.showSocialLinks && footer.socialLinks && (
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '14px' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {footer.socialLinks.instagram && <a href={footer.socialLinks.instagram} target="_blank" rel="noopener" style={{ color: c('footerText', '#9ca3af') }}><Instagram size={18} /></a>}
                {footer.socialLinks.twitter && <a href={footer.socialLinks.twitter} target="_blank" rel="noopener" style={{ color: c('footerText', '#9ca3af') }}><Twitter size={18} /></a>}
                {footer.socialLinks.facebook && <a href={footer.socialLinks.facebook} target="_blank" rel="noopener" style={{ color: c('footerText', '#9ca3af') }}><Facebook size={18} /></a>}
              </div>
            </div>
          )}
        </div>
        {footer.copyrightText && (
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px' }}>{footer.copyrightText}</p>
        )}
      </footer>

      {/* Mini-cart drawer */}
      <MiniCartPreview />

      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
}
