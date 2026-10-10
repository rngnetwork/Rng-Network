'use client';

import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} rounded-apple-xl bg-surface-elevated border border-surface-border shadow-elevated overflow-hidden z-10 flex flex-col max-h-[90vh] ${className}`}
      >
        <div className="flex items-start justify-between p-4 border-b border-surface-border/60">
          <div className="flex flex-col pr-4">
            {title ? (
              <h2 id="modal-title" className="text-base font-semibold text-text-primary leading-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-xs text-text-secondary mt-1">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-apple-sm text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-colors -mr-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 text-sm text-text-secondary">
          {children}
        </div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 p-3.5 bg-surface-canvas/50 border-t border-surface-border/60">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
