'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'idle' | 'dnd';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { box: string; text: string; dot: string; px: number }> = {
  sm: { box: 'w-6 h-6', text: 'text-[10px]', dot: 'w-1.5 h-1.5', px: 24 },
  md: { box: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2', px: 32 },
  lg: { box: 'w-10 h-10', text: 'text-sm', dot: 'w-2.5 h-2.5', px: 40 },
  xl: { box: 'w-14 h-14', text: 'text-base', dot: 'w-3 h-3', px: 56 },
};

const statusClasses: Record<AvatarStatus, string> = {
  online: 'bg-accent-success ring-surface-canvas',
  offline: 'bg-text-tertiary ring-surface-canvas',
  idle: 'bg-accent-warning ring-surface-canvas',
  dnd: 'bg-accent-danger ring-surface-canvas',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  fallback,
  size = 'md',
  status,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = sizeClasses[size];

  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : alt.slice(0, 2).toUpperCase();

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none rounded-full ${className}`}>
      <div
        className={`${sizeConfig.box} rounded-full overflow-hidden bg-surface-elevated border border-surface-border flex items-center justify-center font-semibold text-text-primary ${sizeConfig.text}`}
      >
        {src && !hasError ? (
          <Image
            src={src}
            alt={alt}
            width={sizeConfig.px}
            height={sizeConfig.px}
            unoptimized
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ${sizeConfig.dot} ${statusClasses[status]}`}
          aria-label={`Status: ${status}`}
        />
      ) : null}
    </div>
  );
};
