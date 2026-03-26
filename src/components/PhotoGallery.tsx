'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  name: string;
  /** Show as inline carousel (for cards) or just a clickable thumbnail */
  mode?: 'carousel' | 'thumbnail';
  /** Size of thumbnail */
  size?: string;
  /** Additional className for the container */
  className?: string;
}

export default function PhotoGallery({ photos, name, mode = 'thumbnail', size = 'w-16 h-16', className = '' }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Swipe support
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const swiping = useRef(false);

  const prev = useCallback(() => setCurrentIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrentIndex(i => (i + 1) % photos.length), [photos.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current) return;
    swiping.current = false;
    if (touchDeltaX.current > 50) prev();
    else if (touchDeltaX.current < -50) next();
    touchDeltaX.current = 0;
  }, [prev, next]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, prev, next]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      {mode === 'thumbnail' && (
        <div
          className={`${size} rounded-2xl overflow-hidden cursor-pointer relative group ${className}`}
          style={{ boxShadow: '0 4px 12px rgba(255, 140, 107, 0.12)' }}
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
        >
          <img src={photos[0]} alt={name} className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-0.5">
              <div className="flex gap-1">
                {photos.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'carousel' && (
        <div
          className={`relative rounded-2xl overflow-hidden ${className}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={photos[currentIndex]}
            alt={`${name} 照片 ${currentIndex + 1}`}
            className="w-full aspect-[4/3] object-cover cursor-pointer transition-opacity duration-200"
            onClick={() => setLightboxOpen(true)}
            draggable={false}
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                aria-label="上一張"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                aria-label="下一張"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                    className={`w-3 h-3 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center bg-transparent p-0`}
                    aria-label={`照片 ${i + 1}`}
                  >
                    <span className={`block w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Lightbox rendered via portal to avoid layout issues */}
      {lightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center animate-fade-in"
          style={{ zIndex: 200, background: 'rgba(30, 25, 20, 0.92)' }}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} 照片瀏覽`}
        >
          <button
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
            onClick={() => setLightboxOpen(false)}
            aria-label="關閉"
          >
            <X size={22} />
          </button>

          <div
            className="relative w-full max-w-lg px-4"
            onClick={e => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={photos[currentIndex]}
              alt={`${name} 照片 ${currentIndex + 1}`}
              className="w-full rounded-2xl object-contain max-h-[75vh]"
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                  aria-label="上一張"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                  aria-label="下一張"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            <div className="text-center mt-4 text-white/80 text-sm font-medium">
              {name} · {currentIndex + 1} / {photos.length}
            </div>

            {photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                  >
                    <img src={p} alt={`縮圖 ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
