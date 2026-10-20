import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'crimson'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  neutral: {
    bg: 'bg-white/[0.06]',
    text: 'text-text-secondary',
    dot: 'bg-text-tertiary',
    border: 'border-surface-border',
  },
  brand: {
    bg: 'bg-brand-red/15',
    text: 'text-brand-red',
    dot: 'bg-brand-red',
    border: 'border-brand-red/30',
  },
  crimson: {
    bg: 'bg-brand-red/15',
    text: 'text-brand-red',
    dot: 'bg-brand-red',
    border: 'border-brand-red/30',
  },
  info: {
    bg: 'bg-accent-info/15',
    text: 'text-accent-info',
    dot: 'bg-accent-info',
    border: 'border-accent-info/30',
  },
  success: {
    bg: 'bg-accent-success/15',
    text: 'text-accent-success',
    dot: 'bg-accent-success',
    border: 'border-accent-success/30',
  },
  warning: {
    bg: 'bg-accent-warning/15',
    text: 'text-accent-warning',
    dot: 'bg-accent-warning',
    border: 'border-accent-warning/30',
  },
  danger: {
    bg: 'bg-accent-danger/15',
    text: 'text-accent-danger',
    dot: 'bg-accent-danger',
    border: 'border-accent-danger/30',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border select-none ${style.bg} ${style.text} ${style.border} ${sizeStyles[size]} ${className}`}
    >
      {dot ? (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </span>
  );
};
