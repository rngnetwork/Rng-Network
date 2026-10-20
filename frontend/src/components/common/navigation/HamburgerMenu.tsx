'use client';

import React from 'react';

export interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  ariaLabel?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggle,
  className = '',
  ariaLabel = 'Toggle navigation menu',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      className={`relative w-9 h-9 rounded-apple-sm flex flex-col items-center justify-center p-2 text-text-secondary hover:text-text-primary hover:bg-white/[0.08] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-red ${className}`}
    >
      <span
        className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out ${
          isOpen ? 'rotate-45 translate-y-1.5' : ''
        }`}
      />
      <span
        className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out my-1 ${
          isOpen ? 'opacity-0 scale-0' : 'opacity-100'
        }`}
      />
      <span
        className={`w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out ${
          isOpen ? '-rotate-45 -translate-y-1.5' : ''
        }`}
      />
    </button>
  );
};
