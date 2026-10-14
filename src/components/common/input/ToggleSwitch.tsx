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

  const handleToggle = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) return;
    if (e) {
      e.stopPropagation();
    }
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-between gap-3 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={(e) => handleToggle(e)}
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
        onClick={(e) => handleToggle(e)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex flex-shrink-0 transition-colors duration-200 ease-in-out rounded-full border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas ${
          isSm ? 'w-8 h-4' : 'w-11 h-6'
        } ${checked ? 'bg-brand-red shadow-sm shadow-brand-red/30' : 'bg-white/[0.12]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out pointer-events-none ${
            isSm
              ? `w-3 h-3 ${checked ? 'translate-x-4' : 'translate-x-0'}`
              : `w-5 h-5 ${checked ? 'translate-x-5' : 'translate-x-0'}`
          }`}
        />
      </button>
    </div>
  );
};
