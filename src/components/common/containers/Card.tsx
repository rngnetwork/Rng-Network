import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  hoverable = false,
  onClick,
}) => {
  const isClickable = Boolean(onClick);
  const hasHeader = Boolean(title || subtitle || headerAction);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`rounded-apple-lg bg-surface-card border border-surface-border p-4 transition-all duration-200 backdrop-blur-sm ${
        hoverable || isClickable
          ? 'hover:border-white/20 hover:shadow-elevated hover:bg-surface-elevated/80 cursor-pointer'
          : ''
      } ${className}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 pb-3.5 mb-3.5 border-b border-white/[0.06]">
          <div className="flex flex-col">
            {title && <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
      {footer && <div className="pt-3.5 mt-3.5 border-t border-white/[0.06]">{footer}</div>}
    </div>
  );
};
