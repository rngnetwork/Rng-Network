'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  active?: boolean;
}

export interface NavbarProps {
  brandName?: string;
  logoSrc?: string;
  items: NavItem[];
  userMenu?: React.ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'RNG Control Center',
  logoSrc,
  items,
  userMenu,
  onMenuClick,
  className = '',
}) => {
  return (
    <header
      className={`sticky top-0 z-40 w-full h-14 bg-surface-canvas/80 backdrop-blur-md border-b border-surface-border px-4 lg:px-6 flex items-center justify-between transition-colors ${className}`}
    >
      <div className="flex items-center gap-4">
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-apple-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.08] lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        ) : null}

        <Link href="/dashboard" className="flex items-center gap-2.5 group select-none">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={brandName}
              width={28}
              height={28}
              unoptimized
              className="w-7 h-7 rounded-apple-sm object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-apple-sm bg-brand-red flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-brand-red/30">
              R
            </div>
          )}
          <span className="font-semibold text-sm text-text-primary tracking-tight group-hover:text-white transition-colors">
            {brandName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-sm text-xs font-medium transition-colors ${
                item.active
                  ? 'bg-brand-red/15 text-brand-red font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]'
              }`}
            >
              {item.icon ? <span className="text-current">{item.icon}</span> : null}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-brand-red/20 text-brand-red font-semibold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {userMenu ? <div className="flex items-center">{userMenu}</div> : null}
      </div>
    </header>
  );
};
