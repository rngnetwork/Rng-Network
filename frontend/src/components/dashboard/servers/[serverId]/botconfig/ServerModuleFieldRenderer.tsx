'use client';

import React from 'react';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown } from '@/components/common/input/Dropdown';

export interface ServerModuleFieldRendererProps {
  modKey: string;
  fieldName: string;
  fieldDef: BotModuleFieldSchema | undefined;
  rawValue: unknown;
  fieldDisabled: boolean;
  isSaving: boolean;
  serverChannels: Array<{ id: string; name: string; type: number }>;
  serverRoles: Array<{ id: string; name: string; color?: string; position: number; assignableByBot?: boolean }>;
  channelOptions: Array<{ label: string; value: string }>;
  roleOptions: Array<{ label: string; value: string }>;
  onFieldChange: (modKey: string, fieldName: string, value: unknown) => void;
}

function resolveFieldLabel(fieldKey: string, fieldDef?: BotModuleFieldSchema): string {
  if (fieldDef?.displayName) return fieldDef.displayName;
  if (fieldDef?.label) return fieldDef.label;

  const spaced = fieldKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).trim();
}

export const ServerModuleFieldRenderer: React.FC<ServerModuleFieldRendererProps> = ({
  modKey,
  fieldName,
  fieldDef,
  rawValue,
  fieldDisabled,
  isSaving,
  serverChannels,
  serverRoles,
  channelOptions,
  roleOptions,
  onFieldChange,
}) => {
  const label = resolveFieldLabel(fieldName, typeof fieldDef === 'object' && fieldDef !== null ? fieldDef : undefined);
  const description = fieldDef?.description;
  const rawType = typeof fieldDef?.type === 'string' ? fieldDef.type : 'STRING';
  const fieldType = rawType.toUpperCase();
  const isChannelField = fieldName.toLowerCase().includes('channel');
  const isRoleField = fieldName.toLowerCase().includes('role');

  if (isChannelField && serverChannels.length > 0) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <Dropdown
          options={channelOptions}
          value={rawValue != null ? String(rawValue) : 'none'}
          onChange={(val) => onFieldChange(modKey, fieldName, val === 'none' ? null : val)}
          disabled={fieldDisabled || isSaving}
          placeholder="Select Channel"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (isRoleField && serverRoles.length > 0) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <Dropdown
          options={roleOptions}
          value={rawValue != null ? String(rawValue) : 'none'}
          onChange={(val) => onFieldChange(modKey, fieldName, val === 'none' ? null : val)}
          disabled={fieldDisabled || isSaving}
          placeholder="Select Role"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldDef?.options && fieldDef.options.length > 0) {
    const dropdownOptions = fieldDef.options.map((opt) => ({
      label: opt,
      value: opt,
    }));
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <Dropdown
          options={dropdownOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={fieldDisabled || isSaving}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldType === 'BOOLEAN' || typeof rawValue === 'boolean') {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-apple-md bg-surface-canvas border border-surface-border">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-primary select-none">{label}</span>
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
        <ToggleSwitch
          checked={Boolean(rawValue)}
          onChange={(checked) => onFieldChange(modKey, fieldName, checked)}
          disabled={fieldDisabled || isSaving}
          aria-label={label}
        />
      </div>
    );
  }

  if (fieldType === 'INTEGER' || fieldType === 'FLOAT' || typeof rawValue === 'number') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <TextInput
          type="number"
          value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
          onChange={(e) => {
            const valStr = e.target.value;
            const parsed = valStr === '' ? null : Number(valStr);
            onFieldChange(modKey, fieldName, parsed);
          }}
          disabled={fieldDisabled || isSaving}
          placeholder={fieldDef?.default !== undefined ? `Default: ${fieldDef.default}` : 'Enter number'}
          min={fieldDef?.min}
          max={fieldDef?.max}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldType === 'JSON') {
    const stringified =
      typeof rawValue === 'object' && rawValue !== null
        ? JSON.stringify(rawValue, null, 2)
        : String(rawValue ?? '');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <textarea
          value={stringified}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onFieldChange(modKey, fieldName, parsed);
            } catch {
              onFieldChange(modKey, fieldName, e.target.value);
            }
          }}
          disabled={fieldDisabled || isSaving}
          rows={3}
          className="w-full px-3 py-2 rounded-apple-md bg-surface-canvas border border-surface-border text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-red/60 disabled:opacity-50 transition-colors"
          placeholder="{}"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
      <TextInput
        type="text"
        value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
        onChange={(e) => onFieldChange(modKey, fieldName, e.target.value)}
        disabled={fieldDisabled || isSaving}
        placeholder={fieldDef?.default !== undefined ? `Default: ${fieldDef.default}` : 'Enter value'}
      />
      {description ? (
        <span className="text-[11px] text-text-tertiary">{description}</span>
      ) : null}
    </div>
  );
};
