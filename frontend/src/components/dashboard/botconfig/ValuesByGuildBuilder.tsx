'use client';

import React, { useMemo } from 'react';
import { Plus, Trash2, Server as ServerIcon } from 'lucide-react';
import type { ServerItem } from '@/lib/model/server';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';

export interface ValuesByGuildBuilderProps {
  valuesByGuild?: Record<string, string | number | boolean | null>;
  onChange: (updated: Record<string, string | number | boolean | null>) => void;
  servers?: ServerItem[];
  disabled?: boolean;
}

export const ValuesByGuildBuilder: React.FC<ValuesByGuildBuilderProps> = ({
  valuesByGuild = {},
  onChange,
  servers = [],
  disabled = false,
}) => {
  const entries = useMemo(() => Object.entries(valuesByGuild || {}), [valuesByGuild]);

  const serverMap = useMemo(() => {
    const map = new Map<string, ServerItem>();
    servers.forEach((s) => map.set(s.id, s));
    return map;
  }, [servers]);

  const serverOptions: DropdownOption[] = useMemo(() => {
    if (servers.length === 0) {
      // If servers are still loading or unavailable, list existing guild IDs
      return entries.map(([guildId]) => ({
        label: `Server ${guildId}`,
        value: guildId,
      }));
    }
    return servers.map((s) => ({
      label: s.name ? `${s.name} (${s.id.slice(-6)})` : s.id,
      value: s.id,
    }));
  }, [servers, entries]);

  const handleAddRow = () => {
    const currentKeys = new Set(Object.keys(valuesByGuild || {}));
    // Pick the first server not yet overridden
    const unselectedServer = servers.find((s) => !currentKeys.has(s.id));
    const newGuildId = unselectedServer ? unselectedServer.id : `guild_${Date.now()}`;

    const next = {
      ...(valuesByGuild || {}),
      [newGuildId]: '',
    };
    onChange(next);
  };

  const handleServerChange = (oldGuildId: string, newGuildId: string) => {
    if (oldGuildId === newGuildId) return;
    const next: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(valuesByGuild || {})) {
      if (k === oldGuildId) {
        next[newGuildId] = v;
      } else {
        next[k] = v;
      }
    }
    onChange(next);
  };

  const handleValueChange = (guildId: string, newValue: string) => {
    const next = {
      ...(valuesByGuild || {}),
      [guildId]: newValue,
    };
    onChange(next);
  };

  const handleRemove = (guildId: string) => {
    const next = { ...(valuesByGuild || {}) };
    delete next[guildId];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-apple-lg bg-[#0E0E12] border border-surface-border">
      <div className="flex items-center justify-between gap-2 border-b border-surface-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <ServerIcon size={14} className="text-brand-red shrink-0" />
          <span className="text-xs font-bold text-text-primary tracking-wide">
            Values By Guild
          </span>
          <span className="text-[10px] font-mono text-text-tertiary">
            ({entries.length} override{entries.length === 1 ? '' : 's'})
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleAddRow}
          disabled={disabled}
          leftIcon={<Plus size={13} />}
          aria-label="Add server override"
        >
          Add Override
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="py-4 text-center text-xs text-text-tertiary font-mono">
          No per-guild overrides configured. All network servers inherit the baseline value.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(([guildId, val]) => {
            const serverName = serverMap.get(guildId)?.name;
            return (
              <div
                key={guildId}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2 rounded-apple-md bg-surface-elevated border border-surface-border/80"
              >
                {/* Server Select Menu (from the 13 servers) */}
                <div className="w-full sm:w-1/2">
                  <Dropdown
                    options={serverOptions}
                    value={guildId}
                    onChange={(newId) => handleServerChange(guildId, newId)}
                    disabled={disabled}
                    placeholder="Select Server"
                  />
                  {serverName ? (
                    <span className="text-[10px] font-mono text-text-tertiary px-1 mt-0.5 truncate block">
                      ID: {guildId}
                    </span>
                  ) : null}
                </div>

                {/* Value's input field */}
                <div className="flex-1">
                  <TextInput
                    placeholder="Override Value"
                    value={val != null ? String(val) : ''}
                    onChange={(e) => handleValueChange(guildId, e.target.value)}
                    disabled={disabled}
                    aria-label={`Override value for ${serverName || guildId}`}
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(guildId)}
                  disabled={disabled}
                  className="p-2 rounded-apple-sm text-text-tertiary hover:text-accent-danger hover:bg-accent-danger/10 transition-colors self-center shrink-0 cursor-pointer disabled:opacity-50"
                  title="Remove override"
                  aria-label={`Remove override for ${guildId}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
