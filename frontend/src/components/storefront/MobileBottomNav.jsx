import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { useI18n } from '../../store/storefrontI18n';

const BADGE_STYLE = {
  position: 'absolute', top: '-6px', right: '-8px', background: '#dc2626', color: '#fff',
  fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 6px', minWidth: '18px', textAlign: 'center',
  boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
};

function renderBadge(item) {
  return item.badge > 0 ? <span style={BADGE_STYLE}>{item.badge}</span> : null;
}

function renderLinkOrButton(item, children, key) {
  const style = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textDecoration: 'none', padding: '4px 12px' };
  if (item.action) {
    return <button key={key} onClick={item.action} style={{ ...style, background: 'none', border: 'none', cursor: 'pointer' }}>{children}</button>;
  }
  return <Link key={key} to={item.path} style={style}>{children}</Link>;
}

/* ── Style 1: Default (frosted glass) ── */
function DefaultNav({ items, isActive, c }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${c('borderColor', 'rgba(229,231,235,0.8)')}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
    }} className="md:hidden">
      {items.map((item, i) => {
        const active = item.path ? isActive(item.path) : false;
        const Icon = item.icon;
        return renderLinkOrButton(item, (
          <>
            <div style={{ position: 'relative' }}>
              <Icon size={22} color={active ? c('primary', '#059669') : c('textMuted', '#6b7280')} />
              {renderBadge(item)}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: active ? c('primary', '#059669') : c('textMuted', '#6b7280'), marginTop: '3px' }}>{item.label}</span>
          </>
        ), i);
      })}
    </nav>
  );
}

/* ── Style 2: Modern (animated underline + icon bounce) ── */
function ModernNav({ items, isActive, c }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const textRefs = useRef([]);
  const itemRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const idx = items.findIndex(item => item.path && isActive(item.path));
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  useEffect(() => {
    const activeEl = itemRefs.current[activeIdx];
    const textEl = textRefs.current[activeIdx];
    if (activeEl && textEl) {
      activeEl.style.setProperty('--lineWidth', `${textEl.offsetWidth}px`);
    }
  }, [activeIdx]);

  const accent = c('primary', '#059669');

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: c('surface', '#fff'), borderTop: `1px solid ${c('borderColor', '#e5e7eb')}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      padding: '6px 0', paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
      '--component-active-color': accent,
    }} className="md:hidden">
      {items.map((item, i) => {
        const isActiveItem = i === activeIdx;
        const Icon = item.icon;
        return (
          <button
            key={i}
            ref={el => itemRefs.current[i] = el}
            onClick={() => { setActiveIdx(i); item.action ? item.action() : navigate(item.path); }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 14px',
              position: 'relative', '--lineWidth': '0px',
            }}
          >
            <div style={{ position: 'relative', animation: isActiveItem ? 'iconBounce 0.5s ease' : 'none' }}>
              <Icon size={22} color={isActiveItem ? accent : c('textMuted', '#9ca3af')} strokeWidth={isActiveItem ? 2.5 : 2} />
              {renderBadge(item)}
            </div>
            <strong
              ref={el => textRefs.current[i] = el}
              style={{
                fontSize: '10px', fontWeight: 700, color: isActiveItem ? accent : c('textMuted', '#9ca3af'),
                lineHeight: 1, transition: 'color 0.2s',
              }}
            >
              {item.label}
            </strong>
            <div style={{
              height: '2px', width: 'var(--lineWidth)', background: accent,
              borderRadius: '999px', marginTop: '3px', transition: 'width 0.3s ease',
              opacity: isActiveItem ? 1 : 0,
            }} />
          </button>
        );
      })}
      <style>{`
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          20% { transform: translateY(-4px); }
          40% { transform: translateY(0); }
          60% { transform: translateY(-2px); }
          80% { transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}

/* ── Style 3: Spotlight (dark bar with spotlight glow) ── */
function SpotlightNav({ items, isActive, c }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const idx = items.findIndex(item => item.path && isActive(item.path));
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  const accent = c('primary', '#059669');

  return (
    <nav style={{
      position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '0',
      background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '16px', padding: '8px 6px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06)',
      maxWidth: 'calc(100vw - 24px)', overflow: 'hidden',
    }} className="md:hidden">
      {items.map((item, i) => {
        const isActiveItem = i === activeIdx;
        const Icon = item.icon;
        const distance = Math.abs(activeIdx - i);
        const spotlightOpacity = isActiveItem ? 1 : Math.max(0, 1 - distance * 0.6);
        return (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); item.action ? item.action() : navigate(item.path); }}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '48px', height: '48px', margin: '0 4px', background: 'none', border: 'none',
              cursor: 'pointer', transition: 'all 0.3s',
            }}
          >
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '48px', height: '64px',
              background: `radial-gradient(ellipse at center, ${accent}55 0%, transparent 70%)`,
              borderRadius: '50%', filter: 'blur(8px)',
              opacity: spotlightOpacity, transition: 'opacity 0.3s',
              transitionDelay: isActiveItem ? '0.1s' : '0s',
            }} />
            <div style={{ position: 'relative' }}>
              <Icon size={22} color={isActiveItem ? '#fff' : 'rgba(255,255,255,0.4)'} strokeWidth={isActiveItem ? 2.5 : 2} />
              {renderBadge(item)}
            </div>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Style 4: Pill (floating pill with active background) ── */
function PillNav({ items, isActive, c }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const idx = items.findIndex(item => item.path && isActive(item.path));
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  const accent = c('primary', '#059669');

  return (
    <nav style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '2px',
      background: c('surface', '#fff'), borderRadius: '999px', padding: '6px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
      maxWidth: 'calc(100vw - 24px)',
    }} className="md:hidden">
      {items.map((item, i) => {
        const isActiveItem = i === activeIdx;
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); item.action ? item.action() : navigate(item.path); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: isActiveItem ? '8px 16px' : '8px',
              borderRadius: '999px', background: isActiveItem ? accent : 'transparent',
              color: isActiveItem ? '#fff' : c('textMuted', '#9ca3af'),
              border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} color={isActiveItem ? '#fff' : c('textMuted', '#9ca3af')} />
              {renderBadge(item)}
            </div>
            {isActiveItem && <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}

const NAV_STYLES = {
  default: DefaultNav,
  modern: ModernNav,
  spotlight: SpotlightNav,
  pill: PillNav,
};

export default function MobileBottomNav({ theme, colors }) {
  const location = useLocation();
  const { cartCount, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { t } = useI18n();

  const c = (key, fallback) => (colors && colors[key]) || fallback;

  const isActive = (path) => {
    if (path === '/store') return location.pathname === '/store';
    return location.pathname.startsWith(path);
  };

  const items = [
    { path: '/store', icon: Home, label: t('home') },
    { path: '/store/products', icon: Search, label: t('shop2') },
    { action: () => setIsOpen(true), icon: ShoppingCart, label: t('cart'), badge: cartCount },
    { path: '/store/wishlist', icon: Heart, label: t('wishlist'), badge: wishlistCount },
  ];

  const navStyle = theme?.mobileNav?.style || 'default';
  const NavComponent = NAV_STYLES[navStyle] || DefaultNav;

  return <NavComponent items={items} isActive={isActive} c={c} />;
}
