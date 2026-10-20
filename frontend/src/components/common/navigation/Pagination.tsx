import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  className = '',
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex items-center justify-between flex-wrap gap-3 py-3 text-xs select-none ${className}`}
      aria-label="Pagination"
    >
      {totalItems !== undefined ? (
        <span className="text-text-secondary">
          Showing <span className="font-medium text-text-primary">
            {pageSize ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 1}
          </span> to{' '}
          <span className="font-medium text-text-primary">
            {pageSize ? Math.min(currentPage * pageSize, totalItems) : totalItems}
          </span> of <span className="font-medium text-text-primary">{totalItems}</span> results
        </span>
      ) : <div />}

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-apple-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-text-tertiary">
                …
              </span>
            );
          }
          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`w-7 h-7 rounded-apple-sm text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-brand-red text-white shadow-sm shadow-brand-red/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.08]'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-apple-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
