import React from 'react';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  showValueLabel?: boolean;
  showPercentage?: boolean;
  variant?: 'primary' | 'crimson' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantColors = {
  primary: 'bg-brand-red',
  crimson: 'bg-brand-red',
  success: 'bg-accent-success',
  warning: 'bg-accent-warning',
  danger: 'bg-accent-danger',
};

const sizeHeights = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValueLabel = false,
  showPercentage = false,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const isIndeterminate = value === undefined;
  const percentage = isIndeterminate ? 0 : Math.min(Math.max((value / max) * 100, 0), 100);
  const displayPercentage = showValueLabel || showPercentage;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label || (displayPercentage && !isIndeterminate) ? (
        <div className="flex items-center justify-between text-xs select-none">
          {label ? <span className="font-medium text-text-secondary">{label}</span> : <span />}
          {displayPercentage && !isIndeterminate ? (
            <span className="font-mono text-text-tertiary">{Math.round(percentage)}%</span>
          ) : null}
        </div>
      ) : null}

      <div
        className={`w-full ${sizeHeights[size]} rounded-full bg-white/[0.08] overflow-hidden relative`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        {isIndeterminate ? (
          <div
            className={`h-full w-1/3 rounded-full ${variantColors[variant]} animate-pulse`}
          />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${variantColors[variant]}`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};
