'use client';

import React from 'react';

export interface SegmentedControlOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SegmentedControlProps<T = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T = string>({
  options,
  value,
  onChange,
  disabled = false,
  label,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">
          {label}
        </span>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label || 'Segmented control'}
        className={`inline-flex items-center rounded-apple-md bg-zinc-900 border border-surface-border p-0.5 select-none ${
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
        }`}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const isOptionDisabled = disabled || option.disabled;

          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isOptionDisabled}
              onClick={() => {
                if (!isOptionDisabled && onChange) {
                  onChange(option.value);
                }
              }}
              className={`flex-1 text-center font-medium transition-all duration-150 rounded-apple-sm ${
                isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs md:text-sm'
              } ${
                isSelected
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              } ${
                isOptionDisabled
                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                  : 'cursor-pointer'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
