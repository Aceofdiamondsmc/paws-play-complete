import { useState, useEffect, useCallback } from 'react';
import { Minimize2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function ResetZoomButton() {
  const isMobile = useIsMobile();
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const check = () => setIsZoomed(Math.abs(vv.scale - 1) > 0.05);
    vv.addEventListener('resize', check);
    vv.addEventListener('scroll', check);
    check();

    return () => {
      vv.removeEventListener('resize', check);
      vv.removeEventListener('scroll', check);
    };
  }, []);

  const resetZoom = useCallback(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      // Force re-apply by toggling
      setTimeout(() => {
        meta.setAttribute('content', 'width=device-width, initial-scale=0.999, maximum-scale=0.999, user-scalable=no');
        setTimeout(() => {
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }, 50);
    }
    setIsZoomed(false);
  }, []);

  if (!isMobile || !isZoomed) return null;

  return (
    <button
      onClick={resetZoom}
      className="fixed bottom-28 right-4 z-[60] flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg animate-in fade-in zoom-in duration-300"
      aria-label="Reset zoom"
    >
      <Minimize2 className="w-5 h-5" />
    </button>
  );
}
