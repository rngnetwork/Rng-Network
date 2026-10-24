'use client';

import React from 'react';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Slider } from '@/components/common/input/Slider';
import { TextInput } from '@/components/common/input/TextInput';
import { SegmentedControl } from '@/components/common/input/SegmentedControl';
import { TagInput } from '@/components/common/input/TagInput';
import { DiscordRoleSelect, type DiscordRoleOption } from '@/components/common/input/DiscordRoleSelect';
import { DiscordChannelSelect, type DiscordChannelOption } from '@/components/common/input/DiscordChannelSelect';
import { KeyValueRowBuilder } from './KeyValueRowBuilder';

export interface ModuleAstRendererProps {
  moduleName: string;
  schema: Record<string, BotModuleFieldSchema>;
  values: Record<string, unknown>;
  onChange: (moduleName: string, fieldName: string, value: unknown) => void;
  isNetworkDeck?: boolean;
  serverRoles?: DiscordRoleOption[];
  serverChannels?: DiscordChannelOption[];
  disabled?: boolean;
  className?: string;
}

function humanizeFieldName(name: string): string {
  const result = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
  return result;
}

export const ModuleAstRenderer: React.FC<ModuleAstRendererProps> = ({
  moduleName,
  schema = {},
  values = {},
  onChange,
  isNetworkDeck = false,
  serverRoles = [],
  serverChannels = [],
  disabled = false,
  className = '',
}) => {
  const isMasterEnabled = values.enabled !== false;
  const effectiveDisabled = disabled || !isMasterEnabled;

  const entries = Object.entries(schema);
  const subEntries = entries.filter(([name]) => name !== 'enabled');

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {subEntries.map(([fieldName, fieldSchema]) => {
        const rawValue = values[fieldName];
        const label = fieldSchema.label || humanizeFieldName(fieldName);
        const lowerName = fieldName.toLowerCase();

        return (
          <div
            key={fieldName}
            className="flex flex-col gap-1.5 py-2.5 border-b border-border/40 last:border-b-0"
          >
            {fieldSchema.type === 'BOOLEAN' ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary select-none">
                  {label}
                </span>
                <ToggleSwitch
                  checked={Boolean(rawValue)}
                  onChange={(checked) => onChange(moduleName, fieldName, checked)}
                  disabled={effectiveDisabled}
                  size="sm"
                />
              </div>
            ) : fieldSchema.type === 'INTEGER' ? (
              <Slider
                min={fieldSchema.min ?? 0}
                max={fieldSchema.max ?? 3600}
                value={typeof rawValue === 'number' ? rawValue : 0}
                onChange={(val) => onChange(moduleName, fieldName, val)}
                label={label}
                disabled={effectiveDisabled}
              />
            ) : fieldSchema.type === 'STRING' ? (
              lowerName.endsWith('channelid') ? (
                <DiscordChannelSelect
                  value={typeof rawValue === 'string' ? rawValue : null}
                  onChange={(channelId) => onChange(moduleName, fieldName, channelId)}
                  channels={serverChannels}
                  isNetworkDeck={isNetworkDeck}
                  disabled={effectiveDisabled}
                  label={label}
                />
              ) : lowerName.endsWith('roleid') ? (
                <DiscordRoleSelect
                  value={typeof rawValue === 'string' ? rawValue : null}
                  onChange={(roleId) => onChange(moduleName, fieldName, roleId)}
                  roles={serverRoles}
                  disabled={effectiveDisabled}
                  label={label}
                />
              ) : fieldSchema.options || lowerName.endsWith('punishment') ? (
                <SegmentedControl
                  options={(
                    fieldSchema.options || ['delete', 'mute', 'kick', 'ban']
                  ).map((opt) => ({
                    label: opt.charAt(0).toUpperCase() + opt.slice(1),
                    value: opt,
                  }))}
                  value={typeof rawValue === 'string' ? rawValue : 'delete'}
                  onChange={(val) => onChange(moduleName, fieldName, val)}
                  disabled={effectiveDisabled}
                  label={label}
                  size="sm"
                />
              ) : (
                <TextInput
                  label={label}
                  value={typeof rawValue === 'string' ? rawValue : ''}
                  onChange={(e) => onChange(moduleName, fieldName, e.target.value)}
                  disabled={effectiveDisabled}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              )
            ) : fieldSchema.type === 'JSON' ? (
              Array.isArray(rawValue) || lowerName.endsWith('words') ? (
                <TagInput
                  value={Array.isArray(rawValue) ? (rawValue as string[]) : []}
                  onChange={(tags) => onChange(moduleName, fieldName, tags)}
                  disabled={effectiveDisabled}
                  label={label}
                  placeholder="Type word and press Enter or comma..."
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-text-secondary select-none">
                    {label}
                  </span>
                  <KeyValueRowBuilder
                    value={
                      typeof rawValue === 'object' && rawValue !== null
                        ? (rawValue as Record<string, string>)
                        : {}
                    }
                    onChange={(map) => onChange(moduleName, fieldName, map)}
                    serverRoles={serverRoles}
                    disabled={effectiveDisabled}
                  />
                </div>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
