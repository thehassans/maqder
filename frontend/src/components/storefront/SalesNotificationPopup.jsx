import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, MapPin } from 'lucide-react';
import storeApi from '../../lib/storeApi';

export default function SalesNotificationPopup() {
  const [sales, setSales] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    if (dismissed) return;
    let mounted = true;

    storeApi.get('/recent-sales')
      .then(res => {
        if (!mounted || !res.data.sales?.length) return;
        setSales(res.data.sales);
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || sales.length === 0) return;

    const showNext = () => {
      if (sales.length === 0) return;
      const sale = sales[idxRef.current % sales.length];
      idxRef.current++;
      setCurrentSale(sale);
      setVisible(true);

      setTimeout(() => setVisible(false), 5000);
    };

    const initialDelay = setTimeout(showNext, 3000);
    const interval = setInterval(showNext, 12000);

    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [sales, dismissed]);

  if (dismissed || !currentSale) return null;

  const timeText = currentSale.timeAgo < 1 ? 'just now' :
    currentSale.timeAgo < 60 ? `${currentSale.timeAgo} min ago` :
    `${Math.round(currentSale.timeAgo / 60)} hr ago`;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 150,
          transform: visible ? 'translateY(0)' : 'translateY(120%)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#fff',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #f0f0f0',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '340px',
          cursor: 'pointer',
        }}
        onClick={() => setVisible(false)}
      >
        {currentSale.productImage ? (
          <img src={currentSale.productImage} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingBag size={20} color="#9ca3af" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSale.customerName} purchased
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSale.productTitle}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentSale.city && <><MapPin size={10} /> {currentSale.city} · </>}
            {timeText}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); setVisible(false); }}
          style={{ position: 'absolute', top: '6px', right: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#d1d5db' }}
        >
          <X size={14} />
        </button>
        <style>{`@media (max-width: 640px) { div[style*="bottom: 20px"][style*="left: 20px"] { left: 10px !important; right: 10px !important; max-width: none !important; } }`}</style>
      </div>
    </>
  );
}
