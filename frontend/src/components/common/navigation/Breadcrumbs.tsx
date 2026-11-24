import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumbs" className={`flex items-center text-xs select-none ${className}`}>
      <ol className="flex items-center flex-wrap gap-1.5 text-text-tertiary">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`crumb-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <svg
                  className="w-3.5 h-3.5 text-text-tertiary/60 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : null}

              {isLast ? (
                <span
                  className="font-medium text-text-primary"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-text-primary transition-colors text-text-secondary cursor-pointer"
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-text-primary transition-colors text-text-secondary"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-text-secondary">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
