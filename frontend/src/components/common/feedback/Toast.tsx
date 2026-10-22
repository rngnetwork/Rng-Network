'use client';

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<
  ToastType,
  { border: string; bg: string; text: string; icon: React.ReactNode }
> = {
  success: {
    border: 'border-accent-success/40',
    bg: 'bg-accent-success/10',
    text: 'text-accent-success',
    icon: (
      <svg className="w-4 h-4 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    border: 'border-accent-danger/40',
    bg: 'bg-accent-danger/10',
    text: 'text-accent-danger',
    icon: (
      <svg className="w-4 h-4 text-accent-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    border: 'border-accent-warning/40',
    bg: 'bg-accent-warning/10',
    text: 'text-accent-warning',
    icon: (
      <svg className="w-4 h-4 text-accent-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    border: 'border-accent-info/40',
    bg: 'bg-accent-info/10',
    text: 'text-accent-info',
    icon: (
      <svg className="w-4 h-4 text-accent-info" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 4000,
  onDismiss,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const style = typeStyles[type];

  return (
    <div
      role="alert"
      className={`w-80 rounded-apple-md bg-surface-elevated border shadow-elevated p-3 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-2 duration-150 select-none ${style.border}`}
    >
      <div className={`p-1 rounded-apple-sm ${style.bg} flex-shrink-0 mt-0.5`}>
        {style.icon}
      </div>

      <div className="flex-1 flex flex-col pr-1">
        <span className="text-xs font-semibold text-text-primary leading-tight">{title}</span>
        {description ? (
          <span className="text-[11px] text-text-secondary mt-0.5 leading-snug">
            {description}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss toast"
        className="p-1 rounded-apple-sm text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-colors -mr-1 -mt-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};
