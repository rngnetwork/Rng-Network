'use client';

import React from 'react';
import Image from 'next/image';

export type RngLoadingSpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface RngLoadingSpinnerProps {
  size?: RngLoadingSpinnerSize;
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeConfig: Record<
  RngLoadingSpinnerSize,
  {
    box: string;
    logoPx: number;
    logoClass: string;
    strokeWidth: number;
  }
> = {
  sm: {
    box: 'w-14 h-14',
    logoPx: 26,
    logoClass: 'w-[26px] h-[26px]',
    strokeWidth: 4,
  },
  md: {
    box: 'w-20 h-20',
    logoPx: 38,
    logoClass: 'w-[38px] h-[38px]',
    strokeWidth: 3.5,
  },
  lg: {
    box: 'w-28 h-28',
    logoPx: 54,
    logoClass: 'w-[54px] h-[54px]',
    strokeWidth: 3,
  },
  xl: {
    box: 'w-36 h-36',
    logoPx: 70,
    logoClass: 'w-[70px] h-[70px]',
    strokeWidth: 2.8,
  },
};

export const RngLoadingSpinner: React.FC<RngLoadingSpinnerProps> = ({
  size = 'md',
  label,
  fullScreen = false,
  className = '',
}) => {
  const currentSize = sizeConfig[size];

  const spinnerContent = (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading...'}
      className={`relative flex flex-col items-center justify-center gap-4 select-none ${className}`}
    >
      <div className={`relative ${currentSize.box} flex items-center justify-center`}>
        {/* Ambient Neon Red Glow Aura */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-brand-red/25 blur-xl scale-110 pointer-events-none animate-pulse"
        />

        {/* Looping Neon Glowing Red Arc (Half/Partial Circle) */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full animate-spin motion-reduce:animate-[spin_4s_linear_infinite]"
          style={{ animationDuration: '1.25s' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="neonRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3B4E" />
              <stop offset="50%" stopColor="#E11D2E" />
              <stop offset="100%" stopColor="#990B19" />
            </linearGradient>
            <filter id="neonRedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint base track circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(225, 29, 46, 0.15)"
            strokeWidth={currentSize.strokeWidth}
          />

          {/* Active neon glowing red half-circle arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#neonRedGradient)"
            strokeWidth={currentSize.strokeWidth + 0.8}
            strokeLinecap="round"
            strokeDasharray="132 132"
            filter="url(#neonRedGlow)"
            className="drop-shadow-[0_0_8px_rgba(225,29,46,0.95)]"
          />
        </svg>

        {/* Centered RNG RAC Logo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <Image
            priority
            src="/assets/LOGO_FOR_STAFFS.png"
            alt="RNG RAC Logo"
            width={currentSize.logoPx}
            height={currentSize.logoPx}
            unoptimized
            className={`${currentSize.logoClass} object-cover rounded-full drop-shadow-[0_0_12px_rgba(225,29,46,0.65)]`}
          />
        </div>
      </div>

      {/* Optional Loading Status Label */}
      {label && (
        <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-widest animate-pulse text-center max-w-xs">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-surface-canvas flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-red/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-red/10 blur-3xl pointer-events-none"
        />
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
