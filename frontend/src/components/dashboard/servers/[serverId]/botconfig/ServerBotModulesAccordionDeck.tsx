'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { BotModuleFieldSchema, BotModuleValues } from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';
import { Bot, Shield, Plus } from 'lucide-react';
import { ServerModuleInheritanceBadge } from './ServerModuleInheritanceBadge';
import { ServerModuleFieldRenderer } from './ServerModuleFieldRenderer';

export interface ServerBotModulesAccordionDeckProps {
  moduleKeys: string[];
  schemaModules: Record<string, Record<string, BotModuleFieldSchema>>;
  moduleDisplayNames: Record<string, string>;
  currentModules: Record<string, BotModuleValues>;
  overriddenMap: Record<string, boolean>;
  serverChannels: import('@/components/common/input/DiscordChannelSelect').DiscordChannelOption[];
  serverRoles: Array<{ id: string; name: string; color?: string; position?: number; assignableByBot?: boolean }>;
  channelOptions: Array<{ label: string; value: string }>;
  roleOptions: Array<{ label: string; value: string }>;
  searchQuery: string;
  isSaving: boolean;
  onFieldChange: (modKey: string, fieldName: string, value: unknown) => void;
  onOverride: (modKey: string) => void;
  onRevert?: (modKey: string) => void;
  onExecuteAction?: (modKey: string, fieldName: string) => Promise<void>;
}

function resolveModuleTitle(
  modKey: string,
  schemaModules: Record<string, Record<string, BotModuleFieldSchema>>,
  moduleDisplayNames: Record<string, string>
): string {
  if (moduleDisplayNames[modKey]) {
    return moduleDisplayNames[modKey];
  }

  const modDef = schemaModules[modKey];
  if (modDef?._title?.displayName) return modDef._title.displayName;
  if (modDef?._title?.label) return modDef._title.label;

  const spaced = modKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).trim();
}

function resolveModuleFields(
  modSchema?: Record<string, BotModuleFieldSchema>
): Record<string, BotModuleFieldSchema> {
  if (!modSchema) return {};
  const entries = Object.entries(modSchema).filter(([k]) => !k.startsWith('_'));
  return Object.fromEntries(entries);
}

export const ServerBotModulesAccordionDeck: React.FC<ServerBotModulesAccordionDeckProps> = ({
  moduleKeys,
  schemaModules,
  moduleDisplayNames,
  currentModules,
  overriddenMap,
  serverChannels,
  serverRoles,
  channelOptions,
  roleOptions,
  searchQuery,
  isSaving,
  onFieldChange,
  onOverride,
  onRevert,
  onExecuteAction,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(() =>
    searchQuery ? moduleKeys : (moduleKeys[0] ? [moduleKeys[0]] : [])
  );

  useEffect(() => {
    if (searchQuery) {
      setOpenIds(moduleKeys);
    } else if (moduleKeys.length > 0) {
      setOpenIds((prev) => (prev.length === 0 ? [moduleKeys[0]] : prev));
    }
  }, [searchQuery, moduleKeys]);

  const accordionItems: AccordionItem[] = useMemo(() => {
    return moduleKeys.map((modKey) => {
      const isOpen = openIds.includes(modKey);
      const displayName = resolveModuleTitle(modKey, schemaModules, moduleDisplayNames);
      const modValues = currentModules[modKey] || {};
      const modSchema = resolveModuleFields(schemaModules?.[modKey]);
      const isMasterReadOnly = Boolean(modSchema?.enabled?.readOnly);
      const isEnabled = Boolean(
        modValues.enabled !== undefined
          ? modValues.enabled
          : modSchema?.enabled?.default !== undefined
            ? modSchema.enabled.default
            : false
      );
      const isOverridden = Boolean(overriddenMap[modKey]);

      const subFieldEntries = Object.entries(modSchema).filter(([k]) => k !== 'enabled');
      if (subFieldEntries.length === 0) {
        for (const [vKey] of Object.entries(modValues)) {
          if (vKey !== 'enabled' && !vKey.startsWith('_') && !modSchema[vKey]) {
            subFieldEntries.push([vKey, { type: 'STRING', label: vKey }]);
          }
        }
      }

      const totalFieldsCount = Object.keys(modSchema).length || subFieldEntries.length + 1;

      return {
        id: modKey,
        icon: <Shield size={18} className="text-brand-red shrink-0" />,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`text-sm md:text-base font-bold text-text-primary tracking-tight ${isOpen ? 'whitespace-normal break-words' : 'truncate'}`}>
                {displayName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-canvas border border-surface-border text-text-tertiary hidden sm:inline">
                {modKey}
              </span>
            </div>

            <div className={isOpen ? 'hidden sm:flex items-center shrink-0' : 'flex items-center shrink-0'}>
              <ServerModuleInheritanceBadge
                isOverridden={isOverridden}
                isEnabled={isEnabled}
                totalFieldsCount={totalFieldsCount}
              />
            </div>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex sm:hidden items-center gap-2">
              <ServerModuleInheritanceBadge
                isOverridden={isOverridden}
                isEnabled={isEnabled}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-apple-lg bg-surface-canvas border border-surface-border">
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={isEnabled}
                  onChange={(checked) => onFieldChange(modKey, 'enabled', checked)}
                  disabled={isSaving || isMasterReadOnly}
                  aria-label={`Master enable toggle for ${displayName}`}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    {isEnabled ? 'Module Active' : 'Module Disabled'}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {isOverridden
                      ? 'Server-specific overrides applied.'
                      : 'Inheriting network-wide baseline defaults.'}
                  </span>
                </div>
              </div>
            </div>

            {subFieldEntries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subFieldEntries.map(([fKey, fDef]) => (
                  <ServerModuleFieldRenderer
                    key={fKey}
                    modKey={modKey}
                    fieldName={fKey}
                    fieldDef={fDef}
                    rawValue={modValues[fKey]}
                    fieldDisabled={!isEnabled}
                    isSaving={isSaving}
                    serverChannels={serverChannels}
                    serverRoles={serverRoles}
                    channelOptions={channelOptions}
                    roleOptions={roleOptions}
                    onFieldChange={onFieldChange}
                    onExecuteAction={onExecuteAction}
                  />
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-text-tertiary font-mono">
                No configurable sub-fields registered for this module.
              </div>
            )}
          </div>
        ),
      };
    });
  }, [
    moduleKeys,
    schemaModules,
    moduleDisplayNames,
    currentModules,
    overriddenMap,
    serverChannels,
    serverRoles,
    channelOptions,
    roleOptions,
    openIds,
    isSaving,
    onFieldChange,
    onOverride,
    onRevert,
  ]);

  if (accordionItems.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Bot size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Modules Found</span>
        <span className="text-xs text-text-tertiary font-mono">
          No server bot modules match query &quot;{searchQuery}&quot;
        </span>
      </div>
    );
  }

  return (
    <Accordion
      key={searchQuery ? `server-modules-search-${searchQuery}` : 'server-modules-default'}
      items={accordionItems}
      allowMultiple={true}
      showCollapseAll={true}
      openIds={openIds}
      onOpenIdsChange={setOpenIds}
      className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
    />
  );
};
