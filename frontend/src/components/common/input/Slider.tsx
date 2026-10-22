'use client';

import React from 'react';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showValueTooltip?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  showValueTooltip = true,
  disabled = false,
  className = '',
}) => {
  const percentage =
    max > min ? Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100) : 0;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label || showValueTooltip ? (
        <div className="flex items-center justify-between text-xs select-none">
          {label ? <span className="font-medium text-text-secondary">{label}</span> : <span />}
          {showValueTooltip ? (
            <span className="font-mono text-text-primary px-1.5 py-0.5 rounded-apple-sm bg-surface-elevated border border-surface-border">
              {value}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="relative flex items-center w-full h-5 select-none">
        <div className="w-full h-1.5 rounded-full bg-white/[0.08] relative overflow-hidden">
          <div
            className="h-full bg-brand-red transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={label || 'Slider control'}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-sm border border-brand-red pointer-events-none transition-transform duration-75 ${
            disabled ? 'opacity-50' : ''
          }`}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};
