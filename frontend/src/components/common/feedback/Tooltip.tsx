'use client';

import React, { useState, useRef } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  onlyWhenTruncated?: boolean;
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
  onlyWhenTruncated = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkIsTruncated = (): boolean => {
    if (!containerRef.current) return false;
    const target =
      (containerRef.current.querySelector('.truncate') as HTMLElement) ||
      (containerRef.current.firstElementChild as HTMLElement) ||
      containerRef.current;
    return target.scrollWidth > target.clientWidth;
  };

  const showTooltip = () => {
    if (onlyWhenTruncated && !checkIsTruncated()) {
      return;
    }

    if (delay <= 0) {
      setIsVisible(true);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      if (onlyWhenTruncated && !checkIsTruncated()) {
        setIsVisible(false);
        return;
      }
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex overflow-visible ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content ? (
        <div
          role="tooltip"
          className={`absolute ${positionClasses[position]} z-50 px-2 py-1 text-[11px] font-medium text-text-primary rounded-apple-sm bg-surface-elevated border border-surface-border shadow-elevated whitespace-nowrap pointer-events-none select-none backdrop-blur-md animate-in fade-in duration-150`}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
};
