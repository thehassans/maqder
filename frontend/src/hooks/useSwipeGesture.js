import { useRef, useCallback } from 'react';

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }) {
  const startRef = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < threshold && absDy < threshold) return;

    if (absDx > absDy) {
      if (dx > 0 && onSwipeRight) onSwipeRight();
      if (dx < 0 && onSwipeLeft) onSwipeLeft();
    } else {
      if (dy > 0 && onSwipeDown) onSwipeDown();
      if (dy < 0 && onSwipeUp) onSwipeUp();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return { onTouchStart, onTouchEnd };
}
