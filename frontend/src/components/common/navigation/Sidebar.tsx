import React from 'react';
import Link from 'next/link';

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsed = false,
  onToggleCollapse,
  header,
  footer,
  className = '',
}) => {
  return (
    <aside
      className={`h-full flex flex-col justify-between bg-surface-canvas border-r border-surface-border transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      } ${className}`}
    >
      <div className="flex flex-col">
        {header ? <div className="p-3 border-b border-surface-border/60">{header}</div> : null}

        <nav className="p-2 flex flex-col gap-1">
          {items.map((item) => {
            const content = (
              <>
                {item.icon ? (
                  <span className="flex-shrink-0 text-current flex items-center justify-center">
                    {item.icon}
                  </span>
                ) : null}
                {!collapsed ? (
                  <span className="truncate flex-1 font-medium">{item.label}</span>
                ) : null}
                {!collapsed && item.badge !== undefined ? (
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-brand-red/20 text-brand-red">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );

            const activeClass = item.active
              ? 'bg-brand-red/15 text-brand-red font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.06]';

            const baseClass = `flex items-center gap-3 px-3 py-2 text-xs rounded-apple-sm transition-colors ${
              collapsed ? 'justify-center px-2' : ''
            } ${activeClass}`;

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={baseClass}
                  title={collapsed ? item.label : undefined}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={baseClass}
                title={collapsed ? item.label : undefined}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col border-t border-surface-border/60 p-2">
        {footer ? <div className="mb-2">{footer}</div> : null}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center gap-2 p-2 rounded-apple-sm text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] text-xs transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <polyline points="11 19 4 12 11 5" />
              <polyline points="18 19 11 12 18 5" />
            </svg>
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  );
};
