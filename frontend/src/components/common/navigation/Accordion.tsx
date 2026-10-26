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
  openIds?: string[];
  onOpenIdsChange?: (openIds: string[]) => void;
  allowMultiple?: boolean;
  showCollapseAll?: boolean;
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  defaultOpenIds,
  openIds: controlledOpenIds,
  onOpenIdsChange,
  allowMultiple = false,
  showCollapseAll = false,
  className = '',
  itemClassName = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const isControlled = controlledOpenIds !== undefined;
  const [internalOpenIds, setInternalOpenIds] = useState<string[]>(() => {
    if (defaultOpenIds && defaultOpenIds.length > 0) {
      return defaultOpenIds;
    }
    return defaultOpenId ? [defaultOpenId] : [];
  });

  const activeOpenIds = isControlled ? controlledOpenIds : internalOpenIds;

  const updateOpenIds = (next: string[]) => {
    if (!isControlled) {
      setInternalOpenIds(next);
    }
    onOpenIdsChange?.(next);
  };

  const handleToggle = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (allowMultiple) {
      const next = activeOpenIds.includes(id)
        ? activeOpenIds.filter((i) => i !== id)
        : [...activeOpenIds, id];
      updateOpenIds(next);
    } else {
      const next = activeOpenIds.includes(id) ? [] : [id];
      updateOpenIds(next);
    }
  };

  const handleCollapseAll = () => {
    updateOpenIds([]);
  };

  return (
    <div
      className={`flex flex-col divide-y divide-surface-border rounded-apple-xl border border-surface-border bg-surface-elevated overflow-hidden ${className}`}
    >
      {showCollapseAll && items.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-canvas/60 border-b border-surface-border">
          <span className="text-xs font-mono text-text-tertiary">
            {activeOpenIds.length} of {items.length} expanded
          </span>
          <button
            type="button"
            onClick={handleCollapseAll}
            disabled={activeOpenIds.length === 0}
            className="text-xs font-medium text-brand-red hover:text-brand-red-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none"
            aria-label="Collapse all accordion panels"
          >
            Collapse All
          </button>
        </div>
      )}
      {items.map((item) => {
        const isOpen = activeOpenIds.includes(item.id);

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
