'use client';

import React, { useCallback, useMemo } from 'react';
import type { ServerItem } from '@/lib/model/server';
import { TextInput } from '@/components/common/input/TextInput';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Badge } from '@/components/common/feedback/Badge';
import { ValuesByGuildBuilder } from './ValuesByGuildBuilder';

export interface NetworkKeyConfigCardProps {
  keyName: string;
  displayName: string;
  description?: string;
  rawValue: unknown;
  onChange: (updatedVal: unknown) => void;
  servers: ServerItem[];
  disabled?: boolean;
  hideHeader?: boolean;
}

export const NetworkKeyConfigCard: React.FC<NetworkKeyConfigCardProps> = ({
  keyName,
  displayName,
  description,
  rawValue,
  onChange,
  servers,
  disabled = false,
  hideHeader = false,
}) => {
  const rawObj = useMemo(() => {
    return typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)
      ? (rawValue as Record<string, unknown>)
      : null;
  }, [rawValue]);
  const isObject = rawObj !== null;

  const currentValue = isObject && rawObj
    ? (rawObj.value !== undefined ? rawObj.value : rawObj.default ?? '')
    : (rawValue ?? '');

  const defaultValue = isObject && rawObj ? rawObj.default : undefined;
  const isUniform = isObject && rawObj ? rawObj.uniform !== false : true;
  const serversCount = isObject && rawObj && typeof rawObj.servers === 'number' ? rawObj.servers : 0;
  const valuesByGuild = isObject && rawObj && rawObj.valuesByGuild && typeof rawObj.valuesByGuild === 'object'
    ? (rawObj.valuesByGuild as Record<string, string | number | boolean | null>)
    : {};

  const handleValueChange = useCallback((newVal: string) => {
    if (isObject && rawObj) {
      onChange({
        ...rawObj,
        value: newVal,
      });
    } else {
      onChange(newVal);
    }
  }, [isObject, rawObj, onChange]);

  const handleUniformChange = useCallback((newUniform: boolean) => {
    if (isObject && rawObj) {
      onChange({
        ...rawObj,
        uniform: newUniform,
      });
    } else {
      onChange({
        value: currentValue,
        uniform: newUniform,
      });
    }
  }, [isObject, rawObj, currentValue, onChange]);

  const handleValuesByGuildChange = useCallback((newMap: Record<string, string | number | boolean | null>) => {
    if (isObject && rawObj) {
      onChange({
        ...rawObj,
        valuesByGuild: newMap,
        servers: Object.keys(newMap).length,
      });
    } else {
      onChange({
        value: currentValue,
        valuesByGuild: newMap,
        servers: Object.keys(newMap).length,
      });
    }
  }, [isObject, rawObj, currentValue, onChange]);

  return (
    <div
      className={
        hideHeader
          ? 'flex flex-col gap-4 w-full'
          : 'flex flex-col gap-4 p-4 rounded-apple-xl bg-surface-elevated border border-surface-border shadow-apple-card'
      }
    >
      {/* Parameter Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/40 pb-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-text-primary tracking-tight">
                {displayName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary">
                {keyName}
              </span>
            </div>
            {description ? (
              <span className="text-xs text-text-secondary leading-relaxed">
                {description}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUniform ? (
              <Badge variant="brand" size="sm">
                Uniform
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Overridden ({serversCount} server{serversCount === 1 ? '' : 's'})
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Structured Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Value Field */}
        <div className="flex flex-col gap-1.5">
          <TextInput
            label="Value"
            value={currentValue != null ? String(currentValue) : ''}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter configuration value..."
            helperText="Network-wide baseline value"
          />
        </div>

        {/* Default & Uniform Controls */}
        <div className="flex flex-col justify-between gap-3 p-3 rounded-apple-lg bg-surface-canvas border border-surface-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">Default</span>
            <span className="text-xs font-mono text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded border border-surface-border">
              {defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : 'none'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border/40">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-primary">Uniform</span>
              <span className="text-[11px] text-text-tertiary">
                Enforces parity across all network servers
              </span>
            </div>
            <ToggleSwitch
              checked={isUniform}
              onChange={handleUniformChange}
              disabled={disabled}
              size="sm"
              aria-label={`Toggle uniform for ${keyName}`}
            />
          </div>
        </div>
      </div>

      {/* Values By Guild Custom Component */}
      <div className="mt-1">
        <ValuesByGuildBuilder
          valuesByGuild={valuesByGuild}
          onChange={handleValuesByGuildChange}
          servers={servers}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
