'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  count?: number | string;
  disabled?: boolean;
}

export interface TabStripProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  layoutId?: string;
  className?: string;
  ariaLabel?: string;
}

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  layoutId = 'commonTabStripActiveIndicator',
  className = '',
  ariaLabel = 'Navigation tabs',
}) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className={`relative border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto pb-2.5 scrollbar-none ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          controlledActiveTab !== undefined
            ? controlledActiveTab === tab.id
            : tab.href
            ? pathname === tab.href ||
              (tabs[0]?.id === tab.id &&
                (pathname === tab.href.replace(/\/[^/]+$/, '') ||
                  pathname?.endsWith(tab.href.replace(/\/[^/]+$/, ''))))
            : false;

        const content = (
          <>
            {Icon && (
              <Icon
                size={16}
                className={isActive ? 'text-brand-red' : 'text-zinc-500'}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                  isActive
                    ? 'bg-brand-red/20 text-brand-red'
                    : 'bg-surface-elevated text-text-tertiary'
                }`}
              >
                {tab.count}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-brand-red"
              />
            )}
          </>
        );

        const tabClasses = `relative flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap rounded-apple-md transition-all duration-200 min-h-[44px] cursor-pointer ${
          tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
        } ${
          isActive
            ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-crimson-glow'
            : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
        }`;

        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={tabClasses}
              onClick={() => {
                if (!tab.disabled && onTabChange) {
                  onTabChange(tab.id);
                }
              }}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled && onTabChange) {
                onTabChange(tab.id);
              }
            }}
            className={tabClasses}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
};
