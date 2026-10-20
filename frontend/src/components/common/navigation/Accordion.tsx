'use client';

import React, { useState } from 'react';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  defaultOpenIds?: string[];
  allowMultiple?: boolean;
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  defaultOpenIds,
  allowMultiple = false,
  className = '',
  itemClassName = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const [openIds, setOpenIds] = useState<string[]>(() => {
    if (defaultOpenIds && defaultOpenIds.length > 0) {
      return defaultOpenIds;
    }
    return defaultOpenId ? [defaultOpenId] : [];
  });

  const handleToggle = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (allowMultiple) {
      setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div
      className={`flex flex-col divide-y divide-surface-border rounded-apple-xl border border-surface-border bg-surface-elevated overflow-hidden ${className}`}
    >
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div key={item.id} className={`flex flex-col ${itemClassName}`}>
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => handleToggle(item.id, item.disabled)}
              aria-expanded={isOpen}
              className={`flex items-center justify-between p-4 md:p-5 text-sm font-medium text-left transition-colors select-none ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-text-tertiary'
                  : 'text-text-primary hover:bg-white/[0.04]'
              } ${headerClassName}`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                {item.icon ? (
                  <span className="text-text-secondary flex items-center shrink-0">{item.icon}</span>
                ) : null}
                <div className="min-w-0">{item.title}</div>
              </div>
              <svg
                className={`w-5 h-5 text-text-tertiary transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180 text-brand-red' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen ? (
              <div
                className={`px-5 py-6 md:px-7 md:py-7 text-xs text-text-secondary border-t border-surface-border/40 ${contentClassName}`}
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
