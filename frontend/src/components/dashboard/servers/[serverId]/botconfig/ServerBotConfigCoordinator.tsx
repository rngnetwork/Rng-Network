'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Search, Bot, AlertCircle } from 'lucide-react';
import {
  getServerEffectiveModules,
  patchServerModules,
  resetServerModule,
} from '@/lib/api/bot-module';
import {
  fetchServerChannels,
  fetchServerRoles,
} from '@/lib/api/dashboard/servers/[serverId]/settings';
import type {
  BotModuleFieldSchema,
  BotModuleValues,
  ModuleInheritance,
} from '@/lib/model/bot-module';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { ServerBotModulesAccordionDeck } from './ServerBotModulesAccordionDeck';

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

function resolveFieldLabel(fieldKey: string, fieldDef?: BotModuleFieldSchema): string {
  if (fieldDef?.displayName) return fieldDef.displayName;
  if (fieldDef?.label) return fieldDef.label;

  const spaced = fieldKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).trim();
}

export const ServerBotConfigCoordinator: React.FC = () => {
  const params = useParams();
  const serverId = (params?.serverId as string) || '';
  const { toast } = useToast() || {};

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const [schemaModules, setSchemaModules] = useState<Record<string, Record<string, BotModuleFieldSchema>>>({});
  const [moduleDisplayNames, setModuleDisplayNames] = useState<Record<string, string>>({});
  const [initialModules, setInitialModules] = useState<Record<string, BotModuleValues>>({});
  const [currentModules, setCurrentModules] = useState<Record<string, BotModuleValues>>({});
  const [overriddenMap, setOverriddenMap] = useState<Record<string, boolean>>({});
  const [networkDefaults, setNetworkDefaults] = useState<Record<string, BotModuleValues>>({});

  const [serverChannels, setServerChannels] = useState<Array<{ id: string; name: string; type: number }>>([]);
  const [serverRoles, setServerRoles] = useState<Array<{ id: string; name: string; color?: string; position: number; assignableByBot?: boolean }>>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      if (!serverId) return;
      const token = localStorage.getItem('accessToken') || undefined;

      try {
        const [modulesRes, channelsRes, rolesRes] = await Promise.allSettled([
          getServerEffectiveModules(serverId, token),
          fetchServerChannels(token, serverId),
          fetchServerRoles(serverId, token),
        ]);

        if (!isMounted) return;

        if (modulesRes.status === 'fulfilled' && modulesRes.value.success && modulesRes.value.data) {
          setLoadError(null);
          const data = modulesRes.value.data;
          let schemaObj: Record<string, Record<string, BotModuleFieldSchema>> = {};

          if (data.schema && typeof data.schema === 'object') {
            const rawSchema = data.schema as Record<string, unknown>;
            if (rawSchema.modules && typeof rawSchema.modules === 'object') {
              schemaObj = rawSchema.modules as Record<string, Record<string, BotModuleFieldSchema>>;
            } else {
              const filtered: Record<string, Record<string, BotModuleFieldSchema>> = {};
              for (const [k, v] of Object.entries(rawSchema)) {
                if (k !== 'moduleDisplayNames' && k !== 'networkKeys' && k !== 'networkKeyDisplayNames' && k !== 'modules') {
                  filtered[k] = v as Record<string, BotModuleFieldSchema>;
                }
              }
              schemaObj = filtered;
            }

            if (rawSchema.moduleDisplayNames && typeof rawSchema.moduleDisplayNames === 'object') {
              setModuleDisplayNames(rawSchema.moduleDisplayNames as Record<string, string>);
            }
          }

          const initialValuesMap: Record<string, BotModuleValues> = {};
          const overrides: Record<string, boolean> = {};
          const defaults: Record<string, BotModuleValues> = {};

          const modEntries = Object.entries(data.modules || {}) as [string, ModuleInheritance & { effectiveConfig?: BotModuleValues }][];
          for (const [modName, modInfo] of modEntries) {
            if (
              modName === 'moduleDisplayNames' ||
              modName === 'networkKeys' ||
              modName === 'networkKeyDisplayNames' ||
              modName === 'modules'
            ) {
              continue;
            }
            const effective = (modInfo.effectiveConfig ?? modInfo.values ?? {}) as BotModuleValues;
            initialValuesMap[modName] = JSON.parse(JSON.stringify(effective));
            overrides[modName] = Boolean(modInfo.isOverridden);
            defaults[modName] = modInfo.networkDefault ? JSON.parse(JSON.stringify(modInfo.networkDefault)) : {};
          }

          if (Object.keys(schemaObj).length === 0) {
            const inferred: Record<string, Record<string, BotModuleFieldSchema>> = {};
            for (const [mKey, mVal] of Object.entries(initialValuesMap)) {
              if (typeof mVal === 'object' && mVal !== null) {
                const fMap: Record<string, BotModuleFieldSchema> = {};
                for (const [fKey, fVal] of Object.entries(mVal as Record<string, unknown>)) {
                  let fType: BotModuleFieldSchema['type'] = 'STRING';
                  if (typeof fVal === 'boolean') fType = 'BOOLEAN';
                  else if (typeof fVal === 'number') fType = Number.isInteger(fVal) ? 'INTEGER' : 'FLOAT';
                  fMap[fKey] = { type: fType, label: fKey };
                }
                inferred[mKey] = fMap;
              }
            }
            schemaObj = inferred;
          }

          setSchemaModules(schemaObj);
          setOverriddenMap(overrides);
          setNetworkDefaults(defaults);
          setInitialModules(JSON.parse(JSON.stringify(initialValuesMap)));
          setCurrentModules(JSON.parse(JSON.stringify(initialValuesMap)));
        } else {
          const msg =
            modulesRes.status === 'fulfilled'
              ? modulesRes.value.message
              : 'Failed to retrieve server bot module configurations.';
          setLoadError(msg || 'Failed to load server bot modules.');
        }

        if (channelsRes.status === 'fulfilled' && channelsRes.value.success && Array.isArray(channelsRes.value.data)) {
          setServerChannels(
            channelsRes.value.data.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
            }))
          );
        }

        if (rolesRes.status === 'fulfilled' && rolesRes.value.success && Array.isArray(rolesRes.value.data)) {
          setServerRoles(
            rolesRes.value.data.map((r) => ({
              id: r.id,
              name: r.name,
              color: r.colorHex || undefined,
              position: r.position,
              assignableByBot: r.assignableByBot,
            }))
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Server modules load error';
        setLoadError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAll();

    return () => {
      isMounted = false;
    };
  }, [serverId, reloadTrigger]);

  const handleFieldChange = useCallback((modKey: string, fieldName: string, value: unknown) => {
    setCurrentModules((prev) => ({
      ...prev,
      [modKey]: {
        ...(prev[modKey] || {}),
        [fieldName]: value,
      },
    }));
    setOverriddenMap((prev) => ({
      ...prev,
      [modKey]: true,
    }));
  }, []);

  const handleOverrideModule = useCallback((modKey: string) => {
    setOverriddenMap((prev) => ({
      ...prev,
      [modKey]: true,
    }));
    toast?.({
      title: `Module ${resolveModuleTitle(modKey, schemaModules, moduleDisplayNames)} marked for custom server override.`,
      type: 'info',
    });
  }, [schemaModules, moduleDisplayNames, toast]);

  const handleRevertModule = useCallback(async (modKey: string) => {
    try {
      const token = localStorage.getItem('accessToken') || undefined;
      const res = await resetServerModule(serverId, modKey, token);

      if (res.success) {
        setOverriddenMap((prev) => ({
          ...prev,
          [modKey]: false,
        }));
        const defaultValues = networkDefaults[modKey] ? JSON.parse(JSON.stringify(networkDefaults[modKey])) : {};
        setCurrentModules((prev) => ({
          ...prev,
          [modKey]: defaultValues,
        }));
        setInitialModules((prev) => ({
          ...prev,
          [modKey]: defaultValues,
        }));
        toast?.({
          title: `Module ${resolveModuleTitle(modKey, schemaModules, moduleDisplayNames)} reverted to network default.`,
          type: 'success',
        });
      } else {
        toast?.({
          title: res.message || `Failed to revert module ${modKey}.`,
          type: 'error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revert module';
      toast?.({ title: msg, type: 'error' });
    }
  }, [serverId, networkDefaults, schemaModules, moduleDisplayNames, toast]);

  const { dirtyPayload, dirtyCount, isDirty } = useMemo(() => {
    const dirty: Record<string, Record<string, unknown>> = {};
    let count = 0;

    for (const [modKey, modValues] of Object.entries(currentModules)) {
      const initModValues = initialModules[modKey] || {};
      for (const [fName, fVal] of Object.entries(modValues)) {
        const initVal = initModValues[fName];
        if (JSON.stringify(fVal) !== JSON.stringify(initVal)) {
          if (!dirty[modKey]) {
            dirty[modKey] = {};
          }
          dirty[modKey][fName] = fVal;
          count++;
        }
      }
    }

    return {
      dirtyPayload: dirty,
      dirtyCount: count,
      isDirty: count > 0,
    };
  }, [currentModules, initialModules]);

  const handleResetAll = useCallback(() => {
    setCurrentModules(JSON.parse(JSON.stringify(initialModules)));
  }, [initialModules]);

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('accessToken') || undefined;
      const res = await patchServerModules(serverId, dirtyPayload, token);

      if (res.success) {
        setInitialModules(JSON.parse(JSON.stringify(currentModules)));
        toast?.({
          title: 'Server bot modules updated successfully.',
          type: 'success',
        });
      } else {
        toast?.({
          title: res.message || 'Failed to save server bot modules.',
          type: 'error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server save error';
      toast?.({ title: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, serverId, dirtyPayload, currentModules, toast]);

  const allModuleKeys = useMemo(() => {
    const keysFromSchema = Object.keys(schemaModules || {});
    const keysFromModules = Object.keys(currentModules || {});
    const combined = Array.from(new Set([...keysFromSchema, ...keysFromModules]));
    return combined
      .filter(
        (k) =>
          k !== 'modules' &&
          k !== 'moduleDisplayNames' &&
          k !== 'networkKeys' &&
          k !== 'networkKeyDisplayNames'
      )
      .sort();
  }, [schemaModules, currentModules]);

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allModuleKeys;

    return allModuleKeys.filter((modKey) => {
      const displayName = resolveModuleTitle(modKey, schemaModules, moduleDisplayNames);
      const fields = resolveModuleFields(schemaModules?.[modKey]);

      const nameMatch =
        modKey.toLowerCase().includes(query) ||
        displayName.toLowerCase().includes(query);

      const fieldMatch = Object.entries(fields).some(([fKey, fDef]) => {
        const label = resolveFieldLabel(fKey, fDef);
        return fKey.toLowerCase().includes(query) || label.toLowerCase().includes(query);
      });

      return nameMatch || fieldMatch;
    });
  }, [allModuleKeys, schemaModules, moduleDisplayNames, searchQuery]);

  const channelOptions = useMemo(() => {
    return [
      { label: 'None (Disabled)', value: 'none' },
      ...serverChannels.map((c) => ({
        label: `#${c.name}`,
        value: c.id,
      })),
    ];
  }, [serverChannels]);

  const roleOptions = useMemo(() => {
    return [
      { label: 'None (Disabled)', value: 'none' },
      ...serverRoles.map((r) => ({
        label: `@${r.name}`,
        value: r.id,
      })),
    ];
  }, [serverRoles]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RngLoadingSpinner size="md" />
        <span className="text-xs text-text-tertiary font-mono">
          Loading server bot modules...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 rounded-apple-xl border border-brand-red/30 bg-brand-red/5 flex flex-col items-center justify-center text-center gap-3 my-6">
        <AlertCircle size={24} className="text-brand-red" />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-text-primary">Unable to load server bot modules</h2>
          <p className="text-xs text-text-secondary font-mono">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setReloadTrigger((prev) => prev + 1);
          }}
          className="px-4 py-2 rounded-apple-md bg-surface-elevated border border-surface-border text-xs text-text-primary hover:border-brand-red transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full py-4">
      {/* Top Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-apple-sm bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red shadow-crimson-glow">
              <Bot size={15} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Server Bot Modules
            </h1>
          </div>
          <p className="text-xs text-text-secondary">
            Configure server-specific module overrides or inherit network defaults.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
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

      {/* Accordion Views */}
      <ServerBotModulesAccordionDeck
        moduleKeys={filteredModules}
        schemaModules={schemaModules}
        moduleDisplayNames={moduleDisplayNames}
        currentModules={currentModules}
        overriddenMap={overriddenMap}
        serverChannels={serverChannels}
        serverRoles={serverRoles}
        channelOptions={channelOptions}
        roleOptions={roleOptions}
        searchQuery={searchQuery}
        isSaving={isSaving}
        onFieldChange={handleFieldChange}
        onOverride={handleOverrideModule}
        onRevert={handleRevertModule}
      />

      {/* Sticky Bottom Unsaved Changes Bar */}
      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleResetAll}
        message={`You have unsaved changes in ${dirtyCount} server setting${dirtyCount === 1 ? '' : 's'}.`}
        resetLabel="Discard"
      />
    </div>
  );
};
