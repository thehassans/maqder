import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../../store/storefrontCart';
import { useWishlist } from '../../store/storefrontWishlist';
import { useI18n } from '../../store/storefrontI18n';

export default function MobileBottomNav() {
  const location = useLocation();
  const { cartCount, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { t } = useI18n();

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

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(229,231,235,0.8)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
    }} className="md:hidden">
      {items.map((item, i) => {
        const active = item.path ? isActive(item.path) : false;
        const Icon = item.icon;
        const content = (
          <>
            <div style={{ position: 'relative' }}>
              <Icon size={22} color={active ? '#4f46e5' : '#6b7280'} />
              {item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px', background: '#dc2626', color: '#fff',
                  fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '2px 6px', minWidth: '18px', textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
                }}>{item.badge}</span>
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#4f46e5' : '#6b7280', marginTop: '3px' }}>{item.label}</span>
          </>
        );
        if (item.action) {
          return (
            <button key={i} onClick={item.action} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
            }}>
              {content}
            </button>
          );
        }
        return (
          <Link key={i} to={item.path} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            textDecoration: 'none', padding: '4px 12px',
          }}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
