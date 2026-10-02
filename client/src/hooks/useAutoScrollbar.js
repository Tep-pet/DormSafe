import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to automatically hide the scrollbar when idle,
 * and reveal it smoothly when the user is actively scrolling.
 *
 * @param {number} idleTimeoutMs - Duration in milliseconds before fading out the scrollbar. Default: 1200ms
 */
export function useAutoScrollbar(idleTimeoutMs = 1200) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, idleTimeoutMs);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling,
    handleScroll,
    scrollbarClassName: `auto-hide-scrollbar ${isScrolling ? 'is-scrolling' : ''}`.trim(),
  };
}
