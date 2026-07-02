import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children, colors }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const c = (key, fallback) => (colors && colors[key]) || fallback;

  const handleTouchStart = (e) => {
    sheetRef.current._startY = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!sheetRef.current) return;
    const dy = e.touches[0].clientY - (sheetRef.current._startY || 0);
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = (e) => {
    if (!sheetRef.current) return;
    const dy = e.changedTouches[0].clientY - (sheetRef.current._startY || 0);
    sheetRef.current.style.transition = 'transform 0.3s ease';
    sheetRef.current.style.transform = '';
    if (dy > 100) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
            transition: 'background 0.3s ease',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <div
            ref={sheetRef}
            onClick={e => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              width: '100%', maxWidth: '500px',
              background: c('background', '#fff'),
              borderRadius: '20px 20px 0 0',
              maxHeight: '85vh', overflowY: 'auto',
              transform: visible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: c('borderColor', '#d1d5db'),
              margin: '12px auto 0', flexShrink: 0,
            }} />

            {/* Header */}
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px 12px',
              }}>
                <h3 style={{
                  fontSize: '17px', fontWeight: 800, margin: 0,
                  color: c('text', '#111'), letterSpacing: '-0.3px',
                }}>{title}</h3>
                <button
                  onClick={onClose}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: 'none', background: c('surface', '#f3f4f6'),
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <X size={18} color={c('text', '#111')} />
                </button>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: title ? '0 20px 20px' : '20px' }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
