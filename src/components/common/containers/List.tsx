import React from 'react';

export interface ListItemProps {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ListProps {
  items: ListItemProps[];
  emptyState?: React.ReactNode;
  className?: string;
  divided?: boolean;
}

export const List: React.FC<ListProps> = ({
  items,
  emptyState,
  className = '',
  divided = true,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className={`p-6 text-center text-xs text-text-tertiary ${className}`}>
        {emptyState || 'No items to display'}
      </div>
    );
  }

  return (
    <div
      role="list"
      className={`rounded-apple-lg border border-surface-border bg-surface-card overflow-hidden ${
        divided ? 'divide-y divide-surface-border/50' : ''
      } ${className}`}
    >
      {items.map((item) => {
        const isClickable = Boolean(item.onClick);

        return (
          <div
            key={item.id}
            role={isClickable ? 'button' : 'listitem'}
            tabIndex={isClickable ? 0 : undefined}
            onClick={item.onClick}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            className={`flex items-center justify-between p-3.5 transition-colors select-none ${
              isClickable
                ? 'hover:bg-white/[0.04] cursor-pointer'
                : ''
            } ${item.className || ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.leading ? (
                <div className="flex-shrink-0 text-text-secondary">{item.leading}</div>
              ) : null}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-text-primary truncate">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="text-[11px] text-text-secondary truncate mt-0.5">
                    {item.subtitle}
                  </span>
                ) : null}
              </div>
            </div>

            {item.trailing ? (
              <div className="flex-shrink-0 ml-3 flex items-center">{item.trailing}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
