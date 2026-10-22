'use client';

import React from 'react';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  disabled = false,
  className = '',
}) => {
  const canDecrement = !disabled && value - step >= min;
  const canIncrement = !disabled && value + step <= max;

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(Math.max(value - step, min));
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(Math.min(value + step, max));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(e.target.value);
    if (!isNaN(parsed)) {
      onChange(Math.min(Math.max(parsed, min), max));
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">{label}</span>
      ) : null}
      <div
        className={`inline-flex items-center rounded-apple-md bg-[#0E0E12] border border-surface-border p-0.5 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-surface-canvas' : ''
        }`}
      >
        <button
          type="button"
          disabled={!canDecrement}
          onClick={handleDecrement}
          className="w-8 h-8 rounded-apple-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          aria-label="Decrement"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <input
          type="number"
          value={value}
          disabled={disabled}
          min={min === -Infinity ? undefined : min}
          max={max === Infinity ? undefined : max}
          step={step}
          onChange={handleInputChange}
          className="w-14 px-1 py-1 text-center font-mono text-sm font-medium text-text-primary bg-transparent outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          type="button"
          disabled={!canIncrement}
          onClick={handleIncrement}
          className="w-8 h-8 rounded-apple-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          aria-label="Increment"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
