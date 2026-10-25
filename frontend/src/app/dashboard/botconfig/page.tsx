'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Bot,
  Globe,
  AlertCircle,
  Coins,
  Hash,
  ShieldAlert,
  Activity,
  Users,
  Trophy,
  Landmark,
  Sliders,
  Shield,
} from 'lucide-react';
import { getNetworkDefaultModules, patchNetworkDefaultModules } from '@/lib/api/bot-module';
import type {
  BotModuleFieldSchema,
  NetworkKeySchema,
  NetworkDefaultPayload,
  BotModuleValues,
} from '@/lib/model/bot-module';
import { Accordion, type AccordionItem } from '@/components/common/navigation/Accordion';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown } from '@/components/common/input/Dropdown';
import { Badge } from '@/components/common/feedback/Badge';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';

interface DomainCategoryDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  predicate: (k: string) => boolean;
}

const DOMAIN_CATEGORIES: DomainCategoryDefinition[] = [
  {
    id: 'financial',
    title: 'Financial & Economy Ratios',
    description: 'Multiplier rates, taxations, salaries, fines, and economic transaction ratios.',
    icon: <Coins size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) =>
      k.includes('_ratio') ||
      k.includes('_multiplier') ||
      k.includes('_salary') ||
      k.includes('_tax') ||
      k.includes('_fine') ||
      k.includes('_fee') ||
      k.includes('_rate'),
  },
  {
    id: 'channels',
    title: 'Payout & Log Channels',
    description: 'Network broadcast routing and designated Discord channel destinations.',
    icon: <Hash size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) => k.includes('_channel') || k.includes('_log_channel'),
  },
  {
    id: 'moderation',
    title: 'Moderation & Gulag',
    description: 'Punishment timers, auto-moderation thresholds, and detention governance.',
    icon: <ShieldAlert size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) =>
      k.includes('gulag') ||
      k.includes('mute') ||
      k.includes('ban') ||
      k.includes('warn') ||
      k.includes('mod'),
  },
  {
    id: 'activity',
    title: 'Activity, RT & Rewards',
    description: 'Real-time telemetry multipliers, engagement incentives, and activity quotas.',
    icon: <Activity size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) =>
      k.includes('rt_') || k.includes('activity_') || k.includes('reward_'),
  },
  {
    id: 'citizen',
    title: 'Citizen Tiers & Roles',
    description: 'Clearance hierarchy designations, tier thresholds, and citizenship roles.',
    icon: <Users size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) =>
      k.includes('tier_') || k.includes('_role') || k.includes('citizen_'),
  },
  {
    id: 'events',
    title: 'Events & Rivals 1v1',
    description: 'Competitive tournament mechanics, matchmaking, and event parameters.',
    icon: <Trophy size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) => k.includes('event_') || k.includes('rivals_'),
  },
  {
    id: 'ministry',
    title: 'Ministry Budgets & Allocations',
    description: 'Treasury allocations, ministerial caps, and governmental operational funds.',
    icon: <Landmark size={18} className="text-brand-red shrink-0" />,
    predicate: (k: string) => k.includes('ministry_') || k.includes('budget_'),
  },
  {
    id: 'general',
    title: 'General & System Parameters',
    description: 'Global system properties, metadata, and core environment configuration.',
    icon: <Sliders size={18} className="text-brand-red shrink-0" />,
    predicate: () => true,
  },
];

function getCategoryForNetworkKey(key: string): string {
  const lower = key.toLowerCase();
  for (const cat of DOMAIN_CATEGORIES) {
    if (cat.predicate(lower)) {
      return cat.id;
    }
  }
  return 'general';
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

function resolveNetworkKeyTitle(
  key: string,
  schema?: NetworkDefaultPayload['schema']
): string {
  if (schema?.networkKeyDisplayNames && schema.networkKeyDisplayNames[key]) {
    return schema.networkKeyDisplayNames[key];
  }
  const keyDef = schema?.networkKeys?.[key];
  return keyDef?.label || keyDef?.displayName || key;
}

export default function BotConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'network'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const [schema, setSchema] = useState<NetworkDefaultPayload['schema']>({});
  const [initialModules, setInitialModules] = useState<Record<string, BotModuleValues>>({});
  const [currentModules, setCurrentModules] = useState<Record<string, BotModuleValues>>({});
  const [initialNetwork, setInitialNetwork] = useState<Record<string, unknown>>({});
  const [currentNetwork, setCurrentNetwork] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  let toast: ((msg: { title: string; type: 'success' | 'error' | 'info' | 'warning' }) => void) | undefined;
  try {
    const toastCtx = useToast();
    toast = toastCtx.toast;
  } catch {
    // Outside of ToastProvider
  }

  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const token = localStorage.getItem('accessToken') || undefined;
        const res = await getNetworkDefaultModules(token);

        if (!isMounted) return;

        if (res.success && res.data) {
          setLoadError(null);
          const payload = res.data;
          let schemaData = payload.schema || {};
          let modulesData: Record<string, BotModuleValues> = {};
          let networkData: Record<string, unknown> = {};

          if (payload.modules && typeof payload.modules === 'object') {
            modulesData = payload.modules;
            networkData = payload.network || {};
          } else {
            const rest = { ...payload } as Record<string, unknown>;
            delete rest.schema;
            delete rest.hubGuildId;
            delete rest.servers;
            const net = rest.network;
            delete rest.network;
            modulesData = rest as Record<string, BotModuleValues>;
            networkData = (net as Record<string, unknown>) || {};
          }

          if (!schemaData.modules || Object.keys(schemaData.modules).length === 0) {
            const inferred: Record<string, Record<string, BotModuleFieldSchema>> = {};
            for (const [mKey, mVal] of Object.entries(modulesData)) {
              if (typeof mVal === 'object' && mVal !== null) {
                const fMap: Record<string, BotModuleFieldSchema> = {};
                for (const [fKey, fVal] of Object.entries(mVal as Record<string, unknown>)) {
                  let fType: BotModuleFieldSchema['type'] = 'STRING';
                  if (typeof fVal === 'boolean') fType = 'BOOLEAN';
                  else if (typeof fVal === 'number') fType = Number.isInteger(fVal) ? 'INTEGER' : 'FLOAT';
                  else if (Array.isArray(fVal) || (typeof fVal === 'object' && fVal !== null)) fType = 'JSON';
                  fMap[fKey] = { type: fType, label: fKey };
                }
                inferred[mKey] = fMap;
              }
            }
            schemaData = { ...schemaData, modules: inferred };
          }

          setSchema(schemaData);
          setInitialModules(JSON.parse(JSON.stringify(modulesData)));
          setCurrentModules(JSON.parse(JSON.stringify(modulesData)));
          setInitialNetwork(JSON.parse(JSON.stringify(networkData)));
          setCurrentNetwork(JSON.parse(JSON.stringify(networkData)));
        } else {
          setLoadError(res.message || 'Failed to load network bot modules.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to connect to backend service';
        setLoadError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleModuleFieldChange = useCallback((modKey: string, fieldName: string, value: unknown) => {
    setCurrentModules((prev) => ({
      ...prev,
      [modKey]: {
        ...(prev[modKey] || {}),
        [fieldName]: value,
      },
    }));
  }, []);

  const handleNetworkFieldChange = useCallback((key: string, value: unknown) => {
    setCurrentNetwork((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const { dirtyModules, dirtyModuleFieldCount } = useMemo(() => {
    const dirty: Record<string, Record<string, unknown>> = {};
    let count = 0;

    for (const [modKey, modValues] of Object.entries(currentModules)) {
      const initModValues = initialModules[modKey] || {};
      const modDiff: Record<string, unknown> = {};

      for (const [fieldName, val] of Object.entries(modValues)) {
        const initVal = initModValues[fieldName];
        if (JSON.stringify(val) !== JSON.stringify(initVal)) {
          modDiff[fieldName] = val;
          count++;
        }
      }

      if (Object.keys(modDiff).length > 0) {
        dirty[modKey] = modDiff;
      }
    }

    return { dirtyModules: dirty, dirtyModuleFieldCount: count };
  }, [currentModules, initialModules]);

  const { dirtyNetwork, dirtyNetworkKeyCount } = useMemo(() => {
    const dirty: Record<string, unknown> = {};
    let count = 0;

    for (const [key, val] of Object.entries(currentNetwork)) {
      const initVal = initialNetwork[key];
      if (JSON.stringify(val) !== JSON.stringify(initVal)) {
        dirty[key] = val;
        count++;
      }
    }

    return { dirtyNetwork: dirty, dirtyNetworkKeyCount: count };
  }, [currentNetwork, initialNetwork]);

  const totalDirtyCount = dirtyModuleFieldCount + dirtyNetworkKeyCount;
  const isDirty = totalDirtyCount > 0;

  const handleReset = () => {
    setCurrentModules(JSON.parse(JSON.stringify(initialModules)));
    setCurrentNetwork(JSON.parse(JSON.stringify(initialNetwork)));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('accessToken') || undefined;
      const res = await patchNetworkDefaultModules(
        {
          modules: Object.keys(dirtyModules).length > 0 ? dirtyModules : undefined,
          network: Object.keys(dirtyNetwork).length > 0 ? dirtyNetwork : undefined,
        },
        token
      );

      if (res.success) {
        setInitialModules(JSON.parse(JSON.stringify(currentModules)));
        setInitialNetwork(JSON.parse(JSON.stringify(currentNetwork)));
        toast?.({ title: 'Network default bot modules saved successfully.', type: 'success' });
      } else {
        toast?.({ title: res.message || 'Failed to save network bot modules.', type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network save error';
      toast?.({ title: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const moduleKeys = useMemo(() => {
    const keysFromSchema = Object.keys(schema?.modules || {});
    const keysFromValues = Object.keys(currentModules);
    const set = new Set([...keysFromSchema, ...keysFromValues]);
    return Array.from(set);
  }, [schema, currentModules]);

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return moduleKeys.filter((modKey) => {
      const title = resolveModuleTitle(modKey, schema);
      const fields = resolveModuleFields(schema?.modules?.[modKey]);

      if (!query) return true;
      if (modKey.toLowerCase().includes(query)) return true;
      if (title.toLowerCase().includes(query)) return true;

      for (const [fName, fDef] of Object.entries(fields)) {
        if (fName.toLowerCase().includes(query)) return true;
        const label = resolveFieldLabel(fName, fDef);
        if (label.toLowerCase().includes(query)) return true;
      }

      return false;
    });
  }, [moduleKeys, searchQuery, schema]);

  const networkKeyNames = useMemo(() => {
    const keysFromSchema = Object.keys(schema?.networkKeys || {});
    const keysFromValues = Object.keys(currentNetwork);
    const set = new Set([...keysFromSchema, ...keysFromValues]);
    return Array.from(set);
  }, [schema, currentNetwork]);

  const filteredNetworkKeysByDomain = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const grouped: Record<string, string[]> = {};

    for (const cat of DOMAIN_CATEGORIES) {
      grouped[cat.id] = [];
    }

    for (const key of networkKeyNames) {
      const title = resolveNetworkKeyTitle(key, schema);
      const keySchema = schema?.networkKeys?.[key];
      const desc = keySchema?.description || '';

      const isMatch =
        !query ||
        key.toLowerCase().includes(query) ||
        title.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query);

      if (isMatch) {
        const catId = getCategoryForNetworkKey(key);
        if (grouped[catId]) {
          grouped[catId].push(key);
        } else {
          grouped.general.push(key);
        }
      }
    }

    return grouped;
  }, [networkKeyNames, searchQuery, schema]);

  const renderFieldControl = useCallback((
    modKey: string,
    fieldName: string,
    fieldDef: BotModuleFieldSchema | undefined,
    rawValue: unknown,
    disabled: boolean
  ) => {
    const label = resolveFieldLabel(fieldName, fieldDef);
    const fieldType = fieldDef?.type || 'STRING';
    const description = fieldDef?.description;

    if (fieldDef?.options && fieldDef.options.length > 0) {
      const dropdownOptions = fieldDef.options.map((opt) => ({
        label: opt,
        value: opt,
      }));
      return (
        <Dropdown
          label={label}
          options={dropdownOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => handleModuleFieldChange(modKey, fieldName, val)}
          disabled={disabled}
        />
      );
    }

    if (fieldType === 'BOOLEAN') {
      return (
        <div className="flex items-center justify-between p-3 rounded-apple-md bg-[#0E0E12] border border-surface-border">
          <div className="flex flex-col pr-3">
            <span className="text-xs font-semibold text-text-primary select-none">{label}</span>
            {description ? (
              <span className="text-[11px] text-text-tertiary mt-0.5">{description}</span>
            ) : null}
          </div>
          <ToggleSwitch
            checked={Boolean(rawValue)}
            onChange={(checked) => handleModuleFieldChange(modKey, fieldName, checked)}
            disabled={disabled}
            size="sm"
            aria-label={label}
          />
        </div>
      );
    }

    if (fieldType === 'INTEGER' || fieldType === 'FLOAT') {
      return (
        <TextInput
          type="number"
          label={label}
          helperText={description}
          value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
          onChange={(e) => {
            const strVal = e.target.value;
            if (strVal === '') {
              handleModuleFieldChange(modKey, fieldName, null);
            } else {
              const num = fieldType === 'INTEGER' ? parseInt(strVal, 10) : parseFloat(strVal);
              handleModuleFieldChange(modKey, fieldName, isNaN(num) ? strVal : num);
            }
          }}
          min={fieldDef?.min}
          max={fieldDef?.max}
          disabled={disabled}
        />
      );
    }

    if (fieldType === 'JSON') {
      const displayVal =
        typeof rawValue === 'string'
          ? rawValue
          : rawValue !== undefined && rawValue !== null
          ? JSON.stringify(rawValue, null, 2)
          : '';

      return (
        <div className="flex flex-col gap-1.5 w-full col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
            <span className="text-[10px] font-mono text-text-tertiary">JSON</span>
          </div>
          <textarea
            rows={3}
            value={displayVal}
            onChange={(e) => {
              const text = e.target.value;
              try {
                const parsed = JSON.parse(text);
                handleModuleFieldChange(modKey, fieldName, parsed);
              } catch {
                handleModuleFieldChange(modKey, fieldName, text);
              }
            }}
            placeholder="[]"
            disabled={disabled}
            className="w-full px-3 py-2 rounded-apple-md bg-[#0E0E12] border border-surface-border text-xs text-text-primary font-mono placeholder:text-text-tertiary focus:border-brand-red focus:outline-none transition-colors resize-y disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
      );
    }

    return (
      <TextInput
        type="text"
        label={label}
        helperText={description}
        value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
        onChange={(e) => handleModuleFieldChange(modKey, fieldName, e.target.value)}
        disabled={disabled}
      />
    );
  }, [handleModuleFieldChange]);

  const renderNetworkKeyControl = useCallback((
    key: string,
    keySchema: NetworkKeySchema | undefined,
    rawValue: unknown
  ) => {
    const keyType = (keySchema?.type || 'STRING').toUpperCase();

    if (keySchema?.options && keySchema.options.length > 0) {
      const dropdownOptions = keySchema.options.map((opt) => ({
        label: opt,
        value: opt,
      }));
      return (
        <Dropdown
          options={dropdownOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => handleNetworkFieldChange(key, val)}
        />
      );
    }

    if (keyType === 'BOOLEAN' || typeof rawValue === 'boolean') {
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-text-secondary select-none">Enable / Status</span>
          <ToggleSwitch
            checked={Boolean(rawValue)}
            onChange={(checked) => handleNetworkFieldChange(key, checked)}
            size="sm"
            aria-label={`Toggle for ${key}`}
          />
        </div>
      );
    }

    if (keyType === 'INTEGER' || keyType === 'FLOAT' || keyType === 'NUMBER' || typeof rawValue === 'number') {
      return (
        <TextInput
          type="number"
          value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
          onChange={(e) => {
            const strVal = e.target.value;
            if (strVal === '') {
              handleNetworkFieldChange(key, null);
            } else {
              const num = keyType === 'INTEGER' ? parseInt(strVal, 10) : parseFloat(strVal);
              handleNetworkFieldChange(key, isNaN(num) ? strVal : num);
            }
          }}
        />
      );
    }

    if (keyType === 'JSON' || Array.isArray(rawValue) || (typeof rawValue === 'object' && rawValue !== null)) {
      const displayVal =
        typeof rawValue === 'string'
          ? rawValue
          : rawValue !== undefined && rawValue !== null
          ? JSON.stringify(rawValue, null, 2)
          : '';

      return (
        <textarea
          rows={2}
          value={displayVal}
          onChange={(e) => {
            const text = e.target.value;
            try {
              const parsed = JSON.parse(text);
              handleNetworkFieldChange(key, parsed);
            } catch {
              handleNetworkFieldChange(key, text);
            }
          }}
          className="w-full px-3 py-2 rounded-apple-md bg-surface-canvas border border-surface-border text-xs text-text-primary font-mono placeholder:text-text-tertiary focus:border-brand-red focus:outline-none transition-colors resize-y"
        />
      );
    }

    return (
      <TextInput
        type="text"
        value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
        onChange={(e) => handleNetworkFieldChange(key, e.target.value)}
      />
    );
  }, [handleNetworkFieldChange]);

  const moduleAccordionItems: AccordionItem[] = useMemo(() => {
    return filteredModules.map((modKey) => {
      const displayName = resolveModuleTitle(modKey, schema);
      const fields = resolveModuleFields(schema?.modules?.[modKey]);
      const modValues = currentModules[modKey] || {};
      const isEnabled = modValues.enabled !== false;
      const fieldKeys = Object.keys(fields).filter((k) => k !== 'enabled');
      const totalFieldsCount = Object.keys(fields).length;

      return {
        id: modKey,
        icon: <Shield size={18} className="text-brand-red shrink-0" />,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm md:text-base font-bold text-text-primary tracking-tight truncate">
                {displayName}
              </span>
              <Badge variant={isEnabled ? 'success' : 'neutral'} size="sm" dot>
                {isEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <span className="px-2.5 py-0.5 rounded-apple-sm bg-surface-canvas border border-surface-border text-[11px] font-mono text-text-tertiary shrink-0">
              {totalFieldsCount} {totalFieldsCount === 1 ? 'setting' : 'settings'}
            </span>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between p-4 rounded-apple-lg bg-surface-canvas border border-surface-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-text-primary">
                  Master Module Enable
                </span>
                <span className="text-xs text-text-secondary">
                  Controls network-wide activation of this bot module across all servers.
                </span>
              </div>
              <ToggleSwitch
                checked={isEnabled}
                onChange={(checked) => handleModuleFieldChange(modKey, 'enabled', checked)}
                size="md"
                aria-label={`Master activation for ${displayName}`}
              />
            </div>

            {fieldKeys.length > 0 ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${!isEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                {fieldKeys.map((fName) => {
                  const fDef = fields[fName];
                  const rawVal = modValues[fName];
                  return (
                    <div key={fName} className={fDef?.type === 'JSON' ? 'col-span-1 md:col-span-2' : ''}>
                      {renderFieldControl(modKey, fName, fDef, rawVal, !isEnabled)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-text-tertiary font-mono">
                No additional configuration fields specified for this module.
              </div>
            )}
          </div>
        ),
      };
    });
  }, [filteredModules, schema, currentModules, renderFieldControl, handleModuleFieldChange]);

  const networkAccordionItems: AccordionItem[] = useMemo(() => {
    return DOMAIN_CATEGORIES.map((cat) => {
      const keysInCat = filteredNetworkKeysByDomain[cat.id] || [];

      return {
        id: cat.id,
        icon: cat.icon,
        title: (
          <div className="flex items-center justify-between w-full pr-2 gap-4">
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-sm md:text-base font-bold text-text-primary tracking-tight">
                  {cat.title}
                </span>
                <Badge variant="neutral" size="sm">
                  {keysInCat.length}
                </Badge>
              </div>
              <span className="text-xs text-text-secondary font-normal mt-0.5 hidden sm:inline-block">
                {cat.description}
              </span>
            </div>
          </div>
        ),
        content: (
          <div className="flex flex-col gap-4">
            {keysInCat.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keysInCat.map((key) => {
                  const keySchema = schema?.networkKeys?.[key];
                  const keyTitle = resolveNetworkKeyTitle(key, schema);
                  const isUniform = keySchema?.uniform === true;
                  const rawVal = currentNetwork[key];

                  return (
                    <div
                      key={key}
                      className="flex flex-col justify-between gap-3 p-4 rounded-apple-lg bg-[#0E0E12] border border-surface-border/80 hover:border-surface-border transition-colors shadow-apple-card"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-text-primary tracking-tight">
                            {keyTitle}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUniform ? (
                              <Badge variant="brand" size="sm">
                                Uniform
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary break-all">
                          {key}
                        </span>
                        {keySchema?.description ? (
                          <span className="text-[11px] text-text-secondary leading-relaxed mt-1">
                            {keySchema.description}
                          </span>
                        ) : null}
                      </div>

                      <div className="pt-2 border-t border-surface-border/40">
                        {renderNetworkKeyControl(key, keySchema, rawVal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-text-tertiary font-mono">
                No matching network parameters in this category.
              </div>
            )}
          </div>
        ),
      };
    });
  }, [filteredNetworkKeysByDomain, schema, currentNetwork, renderNetworkKeyControl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RngLoadingSpinner size="lg" />
        <span className="text-xs font-mono text-text-tertiary">
          Loading network module configurations...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 max-w-md mx-auto text-center px-4">
        <div className="w-12 h-12 rounded-apple-lg bg-accent-danger/10 border border-accent-danger/30 flex items-center justify-center text-accent-danger">
          <AlertCircle size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-text-primary">Unable to load modules</h2>
          <p className="text-xs text-text-secondary font-mono">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setReloadTrigger((prev) => prev + 1);
          }}
          className="px-4 py-2 rounded-apple-md bg-surface-elevated border border-surface-border text-xs text-text-primary hover:border-brand-red transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 md:px-8 py-6 w-full">
      {/* Top Header Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-apple-md bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red shadow-crimson-glow">
              <Bot size={18} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
              Network Bot Modules
            </h1>
          </div>
          <p className="text-xs text-text-secondary">
            Authoritative baseline configurations and network parameters synchronized across all connected servers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="flex items-center p-1 rounded-apple-lg bg-surface-canvas border border-surface-border shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-brand-red text-white shadow-apple-card'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Bot size={14} />
              <span>Bot Modules</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'modules' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-tertiary'
                }`}
              >
                {moduleKeys.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-brand-red text-white shadow-apple-card'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Globe size={14} />
              <span>Network Parameters</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'network' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-tertiary'
                }`}
              >
                {networkKeyNames.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules and settings..."
              className="w-full pl-9 pr-3 py-1.5 rounded-apple-md bg-[#0E0E12] border border-surface-border text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-red/60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Accordion Views */}
      {activeTab === 'modules' ? (
        moduleAccordionItems.length > 0 ? (
          <Accordion
            key={searchQuery ? `modules-search-${searchQuery}` : 'modules-default'}
            items={moduleAccordionItems}
            allowMultiple={true}
            defaultOpenIds={searchQuery ? filteredModules : (moduleKeys[0] ? [moduleKeys[0]] : [])}
            className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
          />
        ) : (
          <div className="py-12 rounded-apple-xl border border-surface-border bg-surface-elevated flex flex-col items-center justify-center gap-2 text-center">
            <Bot size={28} className="text-text-tertiary" />
            <span className="text-sm font-semibold text-text-primary">No modules found</span>
            <span className="text-xs text-text-tertiary font-mono">
              No bot modules match query &quot;{searchQuery}&quot;
            </span>
          </div>
        )
      ) : (
        <Accordion
          key={searchQuery ? `network-search-${searchQuery}` : 'network-default'}
          items={networkAccordionItems}
          allowMultiple={true}
          defaultOpenIds={DOMAIN_CATEGORIES.map((c) => c.id)}
          className="rounded-apple-xl border-surface-border bg-surface-elevated shadow-apple-card overflow-hidden"
        />
      )}

      {/* Floating Global Unsaved Changes Bar */}
      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        resetLabel="Discard"
        message={`You have unsaved changes in ${totalDirtyCount} parameter${totalDirtyCount === 1 ? '' : 's'}.`}
      />
    </div>
  );
}
