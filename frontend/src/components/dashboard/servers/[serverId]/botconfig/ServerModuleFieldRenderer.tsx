'use client';

import React from 'react';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { DiscordRoleSelect } from '@/components/common/input/DiscordRoleSelect';
import { DiscordChannelSelect } from '@/components/common/input/DiscordChannelSelect';
import { TagInput } from '@/components/common/input/TagInput';
import { Slider } from '@/components/common/input/Slider';
import { SegmentedControl } from '@/components/common/input/SegmentedControl';

export interface ServerModuleFieldRendererProps {
  modKey: string;
  fieldName: string;
  fieldDef?: BotModuleFieldSchema;
  rawValue: unknown;
  fieldDisabled: boolean;
  isSaving: boolean;
  serverChannels: Array<{ id: string; name: string; type?: number }>;
  serverRoles: Array<{ id: string; name: string; color?: string; position?: number; assignableByBot?: boolean }>;
  channelOptions: DropdownOption[];
  roleOptions: DropdownOption[];
  onFieldChange: (modKey: string, fieldName: string, value: unknown) => void;
}

function resolveFieldLabel(
  fieldName: string,
  fieldDef?: BotModuleFieldSchema
): string {
  return fieldDef?.label || fieldDef?.displayName || fieldName;
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
  onFieldChange,
}) => {
  const label = resolveFieldLabel(fieldName, typeof fieldDef === 'object' && fieldDef !== null ? fieldDef : undefined);
  const description = fieldDef?.description;
  const rawType = typeof fieldDef?.type === 'string' ? fieldDef.type : 'STRING';
  const fieldType = rawType.toUpperCase();
  const isChannelField = fieldName.toLowerCase().includes('channel');
  const isRoleField = fieldName.toLowerCase().includes('role');

  const defaultFormatted = fieldDef?.default !== undefined && fieldDef.default !== null ? String(fieldDef.default) : 'none';

  if (isChannelField && serverChannels.length > 0) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <DiscordChannelSelect
          label={label}
          channels={serverChannels}
          value={rawValue != null && rawValue !== 'none' ? String(rawValue) : null}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
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
        <DiscordRoleSelect
          label={label}
          roles={serverRoles}
          value={rawValue != null && rawValue !== 'none' ? String(rawValue) : null}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={fieldDisabled || isSaving}
          placeholder="Select Role"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  const isArrayField = Array.isArray(rawValue) || fieldType === 'ARRAY' || Array.isArray(fieldDef?.default);
  if (isArrayField) {
    const tags = Array.isArray(rawValue)
      ? (rawValue as unknown[]).map(String)
      : typeof rawValue === 'string' && rawValue.trim().startsWith('[')
        ? (() => {
            try {
              const parsed = JSON.parse(rawValue);
              return Array.isArray(parsed) ? parsed.map(String) : [];
            } catch {
              return [];
            }
          })()
        : [];

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <TagInput
          label={label}
          value={tags}
          onChange={(newTags) => onFieldChange(modKey, fieldName, newTags)}
          disabled={fieldDisabled || isSaving}
          placeholder={`default: ${defaultFormatted}, type: ARRAY`}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldDef?.options && fieldDef.options.length >= 2 && fieldDef.options.length <= 4) {
    const segOptions = fieldDef.options.map((opt) => ({
      label: opt,
      value: opt,
    }));
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <SegmentedControl
          label={label}
          options={segOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={fieldDisabled || isSaving}
          size="sm"
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
          searchable={true}
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

  if (
    (fieldType === 'INTEGER' || fieldType === 'FLOAT' || typeof rawValue === 'number') &&
    typeof fieldDef?.min === 'number' &&
    typeof fieldDef?.max === 'number'
  ) {
    const numVal = typeof rawValue === 'number' ? rawValue : (fieldDef.min ?? 0);
    const step = fieldType === 'FLOAT' ? 0.1 : 1;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <Slider
          label={label}
          min={fieldDef.min}
          max={fieldDef.max}
          step={step}
          value={numVal}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={fieldDisabled || isSaving}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
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
          placeholder={`default: ${defaultFormatted}, type: ${fieldType}`}
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

    const jsonDefault = fieldDef?.default !== undefined && fieldDef.default !== null ? JSON.stringify(fieldDef.default) : 'none';

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
          placeholder={`default: ${jsonDefault}, type: ${fieldType}`}
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
        placeholder={`default: ${defaultFormatted}, type: ${fieldType}`}
      />
      {description ? (
        <span className="text-[11px] text-text-tertiary">{description}</span>
      ) : null}
    </div>
  );
};
