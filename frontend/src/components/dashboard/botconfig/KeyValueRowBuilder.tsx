'use client';

import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { DiscordRoleSelect, type DiscordRoleOption } from '@/components/common/input/DiscordRoleSelect';

export interface KeyValueRowBuilderProps {
  value?: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  serverRoles?: DiscordRoleOption[];
  disabled?: boolean;
  className?: string;
  maxEntries?: number;
}

interface RowItem {
  id: string;
  key: string;
  value: string;
}

export const KeyValueRowBuilder: React.FC<KeyValueRowBuilderProps> = ({
  value = {},
  onChange,
  serverRoles = [],
  disabled = false,
  className = '',
  maxEntries = 100,
}) => {
  const [prevValue, setPrevValue] = useState<Record<string, string>>(value);
  const [rows, setRows] = useState<RowItem[]>(() =>
    Object.entries(value).map(([k, v], idx) => ({
      id: `${k}-${idx}`,
      key: k,
      value: String(v),
    }))
  );

  if (value !== prevValue) {
    setPrevValue(value);
    const currentKeys = Object.keys(value);
    const rowKeys = rows.map((r) => r.key);
    const isDifferent =
      currentKeys.length !== rowKeys.length ||
      currentKeys.some((k) => value[k] !== rows.find((r) => r.key === k)?.value);

    if (isDifferent) {
      setRows(
        Object.entries(value).map(([k, v], idx) => ({
          id: `${k}-${idx}`,
          key: k,
          value: String(v),
        }))
      );
    }
  }

  const emitChange = (newRows: RowItem[]) => {
    setRows(newRows);
    const map: Record<string, string> = {};
    for (const row of newRows) {
      if (row.key.trim()) {
        map[row.key.trim()] = row.value;
      }
    }
    onChange(map);
  };

  const handleAddRow = () => {
    if (disabled || rows.length >= maxEntries) return;

    let nextLevel = 1;
    const existingNumbers = rows
      .map((r) => parseInt(r.key, 10))
      .filter((n) => !isNaN(n));
    if (existingNumbers.length > 0) {
      nextLevel = Math.min(Math.max(...existingNumbers) + 5, 1000);
      while (existingNumbers.includes(nextLevel) && nextLevel < 1000) {
        nextLevel++;
      }
    }

    const newRows: RowItem[] = [
      ...rows,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        key: String(nextLevel),
        value: '',
      },
    ];
    emitChange(newRows);
  };

  const handleKeyChange = (index: number, rawKey: string) => {
    if (disabled) return;

    let cleanKey = rawKey;
    const num = parseInt(rawKey, 10);
    if (!isNaN(num)) {
      if (num > 1000) cleanKey = '1000';
      else if (num < 1) cleanKey = '1';
    }

    const updated = [...rows];
    updated[index] = { ...updated[index], key: cleanKey };
    emitChange(updated);
  };

  const handleValueChange = (index: number, roleId: string | null) => {
    if (disabled) return;
    const updated = [...rows];
    updated[index] = { ...updated[index], value: roleId || '' };
    emitChange(updated);
  };

  const handleRemoveRow = (index: number) => {
    if (disabled) return;
    const updated = rows.filter((_, idx) => idx !== index);
    emitChange(updated);
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <div className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="flex items-center gap-2.5 p-2 rounded-apple-md bg-zinc-900/60 border border-surface-border"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-zinc-400 font-medium">Level</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={row.key}
                disabled={disabled}
                aria-label={`Level for entry ${idx + 1}`}
                onChange={(e) => handleKeyChange(idx, e.target.value)}
                className="w-16 px-2 py-1 rounded-apple-sm bg-zinc-950 border border-zinc-700/60 text-xs text-text-primary text-center font-mono focus:outline-none focus:border-brand-red/50 disabled:opacity-50"
              />
            </div>

            <div className="flex-1">
              <DiscordRoleSelect
                value={row.value || null}
                onChange={(roleId) => handleValueChange(idx, roleId)}
                roles={serverRoles}
                disabled={disabled}
                placeholder="Assign role reward..."
              />
            </div>

            {!disabled ? (
              <button
                type="button"
                aria-label={`Remove entry ${idx + 1}`}
                onClick={() => handleRemoveRow(idx)}
                className="text-zinc-500 hover:text-brand-red transition-colors duration-100 p-1.5 rounded-apple-sm focus:outline-none cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {!disabled && rows.length < maxEntries ? (
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-apple-md border border-dashed border-zinc-700/80 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/40 transition-colors duration-150 cursor-pointer mt-1"
        >
          <Plus size={13} />
          <span>+ Add Entry</span>
        </button>
      ) : null}
    </div>
  );
};
