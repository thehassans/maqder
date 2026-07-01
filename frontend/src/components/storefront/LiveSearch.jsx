import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import SaudiRiyalSymbol from './SaudiRiyalSymbol';
import storeApi from '../../lib/storeApi';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../store/storefrontI18n';

export default function LiveSearch({ placeholder, colors, isRTL }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useI18n();

  const c = (key, fallback) => (colors && colors[key]) || fallback;

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await storeApi.get(`/products?search=${encodeURIComponent(q)}&limit=6`);
      setResults(res.data.products || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val) => {
    setQuery(val);
    setHighlightIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      const product = results[highlightIdx];
      goToProduct(product);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const goToProduct = (product) => {
    const slug = product.seo?.slug || product._id;
    setIsOpen(false);
    setQuery('');
    navigate(`/store/products/${slug}`);
  };

  const goToSearchPage = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/store/products?search=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || t('search')}
          style={{
            flex: 1, padding: '12px 16px', border: `1px solid ${c('borderColor', '#e5e7eb')}`,
            borderRadius: isRTL ? '0 12px 12px 0' : '12px 0 0 12px', fontSize: '14px', outline: 'none',
            transition: 'border-color 0.2s', background: '#fff',
          }}
          onFocusCapture={e => e.target.style.borderColor = c('primary', '#4f46e5')}
          onBlurCapture={e => e.target.style.borderColor = c('borderColor', '#e5e7eb')}
        />
        <button
          onClick={goToSearchPage}
          style={{
            padding: '12px 20px', background: c('primary', '#4f46e5'), color: '#fff', border: 'none',
            borderRadius: isRTL ? '12px 0 0 12px' : '0 12px 12px 0', cursor: 'pointer',
            transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      {isOpen && (query.trim().length >= 2) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: `1px solid ${c('borderColor', '#e5e7eb')}`, borderRadius: '0 0 12px 12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: '-1px',
        }}>
          {loading && results.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: c('textMuted', '#9ca3af'), fontSize: '13px' }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              {t('searching')}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: c('textMuted', '#9ca3af'), fontSize: '13px' }}>
              {t('noProducts')}
            </div>
          ) : (
            <>
              {results.map((product, i) => {
                const slug = product.seo?.slug || product._id;
                const hasSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;
                return (
                  <div
                    key={product._id}
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: highlightIdx === i ? c('surface', '#f9fafb') : '#fff',
                    }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: c('borderColor', '#e5e7eb'), flexShrink: 0 }}>
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9ca3af' }}>No img</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: c('text', '#111'), margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</p>
                      {product.category && <p style={{ fontSize: '11px', color: c('textMuted', '#9ca3af'), margin: 0 }}>{product.category}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                      {hasSale && (
                        <span style={{ fontSize: '11px', color: c('salePriceColor', '#dc2626'), textDecoration: 'line-through' }}>{product.compareAtPrice}</span>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 800, color: c('text', '#111'), display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {product.basePrice} <SaudiRiyalSymbol size={11} color={c('text', '#111')} />
                      </span>
                    </div>
                  </div>
                );
              })}
              <div
                onClick={goToSearchPage}
                style={{
                  padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700,
                  color: c('primary', '#4f46e5'), cursor: 'pointer', borderTop: `1px solid ${c('borderColor', '#e5e7eb')}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = c('surface', '#f9fafb')}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {t('viewAllResults')} →
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
