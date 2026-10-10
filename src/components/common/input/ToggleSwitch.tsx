'use client';

import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const isSm = size === 'sm';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-between gap-3 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      {label ? (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-text-primary leading-tight">{label}</span>
          {description ? (
            <span className="text-xs text-text-secondary mt-0.5">{description}</span>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex flex-shrink-0 transition-colors duration-200 ease-in-out rounded-full border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas ${
          isSm ? 'w-8 h-4' : 'w-10 h-6'
        } ${checked ? 'bg-brand-red shadow-sm shadow-brand-red/30' : 'bg-white/[0.12]'}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out pointer-events-none ${
            isSm
              ? `w-3 h-3 ${checked ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`
              : `w-5 h-5 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'} mt-0.5`
          }`}
        />
      </button>
    </div>
  );
};
