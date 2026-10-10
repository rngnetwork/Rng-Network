'use client';

import React, { useState } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);

  const handleToggle = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (allowMultiple) {
      setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={`flex flex-col divide-y divide-surface-border rounded-apple-md border border-surface-border bg-surface-elevated overflow-hidden ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div key={item.id} className="flex flex-col">
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => handleToggle(item.id, item.disabled)}
              aria-expanded={isOpen}
              className={`flex items-center justify-between p-3.5 text-xs font-medium text-left transition-colors select-none ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-text-tertiary'
                  : 'text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon ? (
                  <span className="text-text-secondary flex items-center">{item.icon}</span>
                ) : null}
                <span>{item.title}</span>
              </div>
              <svg
                className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${
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
              <div className="px-3.5 pb-3.5 pt-1 text-xs text-text-secondary border-t border-surface-border/40">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
