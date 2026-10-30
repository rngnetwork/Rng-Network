'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Shield, Bot } from 'lucide-react';
import type {
  BotModuleFieldSchema,
  NetworkDefaultPayload,
  BotModuleValues,
} from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown } from '@/components/common/input/Dropdown';
import { Badge } from '@/components/common/feedback/Badge';
import { TagInput } from '@/components/common/input/TagInput';
import { DiscordMarkdownEditor } from '@/components/common/input/DiscordMarkdownEditor';
import { Slider } from '@/components/common/input/Slider';
import { SegmentedControl } from '@/components/common/input/SegmentedControl';

export interface BotModulesAccordionDeckProps {
  modules: Record<string, BotModuleValues>;
  schema?: NetworkDefaultPayload['schema'];
  searchQuery: string;
  onFieldChange: (modKey: string, fieldName: string, value: unknown) => void;
  disabled?: boolean;
}

function resolveModuleFields(
  rawDef: Record<string, BotModuleFieldSchema> | { fields?: Record<string, BotModuleFieldSchema>; displayName?: string } | undefined
): Record<string, BotModuleFieldSchema> {
  if (!rawDef) return {};
  if ('fields' in rawDef && rawDef.fields && typeof rawDef.fields === 'object') {
    return rawDef.fields as Record<string, BotModuleFieldSchema>;
  }
  const result: Record<string, BotModuleFieldSchema> = {};
  for (const [k, v] of Object.entries(rawDef)) {
    if (k !== 'displayName' && typeof v === 'object' && v !== null && 'type' in v) {
      result[k] = v as BotModuleFieldSchema;
    }
  }
  return result;
}

function resolveModuleTitle(
  modKey: string,
  schema?: NetworkDefaultPayload['schema']
): string {
  if (schema?.moduleDisplayNames && schema.moduleDisplayNames[modKey]) {
    return schema.moduleDisplayNames[modKey];
  }
  const modDef = schema?.modules?.[modKey];
  if (
    modDef &&
    typeof modDef === 'object' &&
    'displayName' in modDef &&
    typeof modDef.displayName === 'string' &&
    modDef.displayName
  ) {
    return modDef.displayName;
  }
  return modKey;
}

function resolveFieldLabel(
  fieldName: string,
  fieldDef?: BotModuleFieldSchema
): string {
  return fieldDef?.label || fieldDef?.displayName || fieldName;
}

export const BotModulesAccordionDeck: React.FC<BotModulesAccordionDeckProps> = ({
  modules,
  schema,
  searchQuery,
  onFieldChange,
  disabled = false,
}) => {
  const moduleKeys = useMemo(() => {
    const keysFromSchema = Object.keys(schema?.modules || {});
    const keysFromModules = Object.keys(modules || {});
    const combined = Array.from(new Set([...keysFromSchema, ...keysFromModules]));
    return combined.sort();
  }, [schema, modules]);

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return moduleKeys;

    return moduleKeys.filter((modKey) => {
      const displayName = resolveModuleTitle(modKey, schema);
      const fields = resolveModuleFields(schema?.modules?.[modKey]);

      const nameMatch =
        modKey.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query);

      const fieldMatch = Object.entries(fields).some(([fKey, fDef]) => {
        const label = resolveFieldLabel(fKey, fDef);
        return fKey.toLowerCase().includes(query) || label.toLowerCase().includes(query);
      });

      return nameMatch || fieldMatch;
    });
  }, [moduleKeys, schema, searchQuery]);

  const [openIds, setOpenIds] = useState<string[]>(() =>
    searchQuery ? filteredModules : (moduleKeys[0] ? [moduleKeys[0]] : [])
  );

  useEffect(() => {
    if (searchQuery) {
      setOpenIds(filteredModules);
    } else if (moduleKeys.length > 0) {
      setOpenIds((prev) => (prev.length === 0 ? [moduleKeys[0]] : prev));
    }
  }, [searchQuery, filteredModules, moduleKeys]);

  const renderFieldControl = useCallback((
    modKey: string,
    fieldName: string,
    fieldDef: BotModuleFieldSchema | undefined,
    rawValue: unknown,
    fieldDisabled: boolean
  ) => {
    const label = resolveFieldLabel(fieldName, fieldDef);
    const description = fieldDef?.description;
    const fieldType = (fieldDef?.type || 'STRING').toUpperCase();
    const defaultVal = fieldDef?.default !== undefined && fieldDef.default !== null ? String(fieldDef.default) : 'none';

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
            disabled={fieldDisabled || disabled}
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
            disabled={fieldDisabled || disabled}
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
            disabled={fieldDisabled || disabled}
            size="sm"
            aria-label={label}
          />
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
            disabled={fieldDisabled || disabled}
            placeholder={`default: ${defaultVal}, type: ARRAY`}
          />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
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
            disabled={fieldDisabled || disabled}
          />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
      );
    }

    if (fieldType === 'INTEGER' || fieldType === 'FLOAT' || typeof rawValue === 'number') {
      return (
        <TextInput
          type="number"
          label={label}
          helperText={description}
          value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
          placeholder={`default: ${defaultVal}, type: ${fieldType}`}
          onChange={(e) => {
            const strVal = e.target.value;
            if (strVal === '') {
              onFieldChange(modKey, fieldName, null);
            } else {
              const num = fieldType === 'INTEGER' ? parseInt(strVal, 10) : parseFloat(strVal);
              onFieldChange(modKey, fieldName, isNaN(num) ? strVal : num);
            }
          }}
          min={fieldDef?.min}
          max={fieldDef?.max}
          disabled={fieldDisabled || disabled}
        />
      );
    }

    const lowerName = fieldName.toLowerCase();
    const isDescription =
      lowerName.includes('description') ||
      (typeof fieldDef?.label === 'string' && fieldDef.label.toLowerCase().includes('description')) ||
      (typeof fieldDef?.displayName === 'string' && fieldDef.displayName.toLowerCase().includes('description')) ||
      fieldType === 'MARKDOWN' ||
      fieldType === 'TEXTAREA';

    if (isDescription) {
      return (
        <DiscordMarkdownEditor
          label={label}
          helperText={description}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          placeholder={`default: ${defaultVal}, type: ${fieldType}`}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={fieldDisabled || disabled}
        />
      );
    }

    return (
      <TextInput
        type="text"
        label={label}
        helperText={description}
        value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
        placeholder={`default: ${defaultVal}, type: ${fieldType}`}
        onChange={(e) => onFieldChange(modKey, fieldName, e.target.value)}
        disabled={fieldDisabled || disabled}
      />
    );
  }, [onFieldChange, disabled]);

  const accordionItems: AccordionItem[] = useMemo(() => {
    return filteredModules.map((modKey) => {
      const isOpen = openIds.includes(modKey);
      const displayName = resolveModuleTitle(modKey, schema);
      const fields = resolveModuleFields(schema?.modules?.[modKey]);
      const modValues = modules[modKey] || {};
      const isEnabled = modValues.enabled !== false;
      const fieldKeys = Object.keys(fields).filter((k) => k !== 'enabled');
      const totalFieldsCount = Object.keys(fields).length;

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

            <div className={isOpen ? 'hidden sm:flex items-center gap-2 shrink-0' : 'flex items-center gap-2 shrink-0'}>
              {isEnabled ? (
                <Badge variant="brand" size="sm">
                  Active
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Disabled
                </Badge>
              )}
              <span className="text-[11px] font-mono text-text-tertiary hidden md:inline">
                {totalFieldsCount} setting{totalFieldsCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex sm:hidden items-center gap-2">
              {isEnabled ? (
                <Badge variant="brand" size="sm">
                  Active
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Disabled
                </Badge>
              )}
            </div>

            {/* Master Module Enable Switch Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-apple-lg bg-surface-canvas border border-surface-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Module Activation
                </span>
                <span className="text-[11px] text-text-secondary">
                  Enable or disable all automated background features for {displayName}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-medium text-text-secondary">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <ToggleSwitch
                  checked={isEnabled}
                  onChange={(checked) => onFieldChange(modKey, 'enabled', checked)}
                  disabled={disabled}
                  size="md"
                  aria-label={`Master enable toggle for ${displayName}`}
                />
              </div>
            </div>

            {/* Sub-settings form grid */}
            {fieldKeys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldKeys.map((fName) => {
                  const fDef = fields[fName];
                  const lower = fName.toLowerCase();
                  const isDesc =
                    lower.includes('description') ||
                    (typeof fDef?.label === 'string' && fDef.label.toLowerCase().includes('description')) ||
                    (typeof fDef?.displayName === 'string' && fDef.displayName.toLowerCase().includes('description')) ||
                    fDef?.type?.toUpperCase() === 'MARKDOWN' ||
                    fDef?.type?.toUpperCase() === 'TEXTAREA';

                  return (
                    <div key={fName} className={`flex flex-col justify-end ${isDesc ? 'md:col-span-2' : ''}`}>
                      {renderFieldControl(
                        modKey,
                        fName,
                        fields[fName],
                        modValues[fName],
                        !isEnabled
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-text-tertiary font-mono">
                No configurable sub-settings for this module.
              </div>
            )}
          </div>
        ),
      };
    });
  }, [filteredModules, schema, modules, openIds, renderFieldControl, onFieldChange, disabled]);

  if (moduleKeys.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Bot size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Modules Found</span>
        <span className="text-xs text-text-tertiary font-mono">
          No authentic bot modules delivered by upstream API.
        </span>
      </div>
    );
  }

  if (filteredModules.length === 0) {
    return (
      <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
        <Bot size={28} className="text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">No Modules Found</span>
        <span className="text-xs text-text-tertiary font-mono">
          No bot modules match query &quot;{searchQuery}&quot;
        </span>
      </div>
    );
  }

  return (
    <Accordion
      key={searchQuery ? `modules-search-${searchQuery}` : 'modules-default'}
      items={accordionItems}
      allowMultiple={true}
      showCollapseAll={true}
      openIds={openIds}
      onOpenIdsChange={setOpenIds}
      className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
    />
  );
};
