'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface CarouselProps {
  items: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlay = false,
  interval = 5000,
  showArrows = true,
  showDots = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoPlay && items.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, interval);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [autoPlay, interval, items.length]);

  if (!items || items.length === 0) return null;

  const safeIndex = items.length > 0 ? Math.min(currentIndex, items.length - 1) : 0;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className={`relative overflow-hidden rounded-apple-lg border border-surface-border bg-surface-card ${className}`}>
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="w-full flex-shrink-0">
            {item}
          </div>
        ))}
      </div>

      {showArrows && items.length > 1 ? (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-canvas/80 border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-canvas/80 border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      ) : null}

      {showDots && items.length > 1 ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`w-2 h-2 rounded-full transition-all duration-150 ${
                idx === safeIndex
                  ? 'bg-brand-red w-4 shadow-sm shadow-brand-red/50'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
