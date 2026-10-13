'use client';

import React, { useState } from 'react';
import { RngLoadingSpinner } from '../feedback/RngLoadingSpinner';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyState,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comp = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div
      className={`w-full overflow-x-auto rounded-apple-lg border border-surface-border bg-surface-card select-none ${className}`}
    >
      <table className="w-full text-left text-xs text-text-secondary border-collapse">
        <thead className="bg-surface-elevated/70 border-b border-surface-border text-[11px] font-semibold text-text-primary uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => {
              const isSorted = col.accessorKey && sortKey === col.accessorKey;
              return (
                <th
                  key={`${String(col.header)}-${idx}`}
                  scope="col"
                  onClick={() => col.sortable && handleSort(col.accessorKey)}
                  className={`px-4 py-3 ${col.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''} ${
                    col.className || ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable ? (
                      <span className="text-text-tertiary">
                        {isSorted ? (
                          sortDirection === 'asc' ? '▲' : '▼'
                        ) : (
                          '↕'
                        )}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border/50">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-tertiary">
                <RngLoadingSpinner size="sm" label="Loading data..." />
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-tertiary">
                {emptyState || 'No records available'}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={`transition-colors ${
                  onRowClick
                    ? 'hover:bg-white/[0.04] cursor-pointer outline-none focus-visible:bg-white/[0.06]'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {columns.map((col, colIdx) => {
                  let content: React.ReactNode = null;
                  if (col.cell) {
                    content = col.cell(row);
                  } else if (col.accessorKey) {
                    content = String(row[col.accessorKey] ?? '');
                  }

                  return (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className={`px-4 py-3 text-text-primary ${col.className || ''}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
