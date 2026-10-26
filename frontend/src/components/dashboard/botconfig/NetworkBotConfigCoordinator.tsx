'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Bot, Globe, AlertCircle, Type, Sliders } from 'lucide-react';
import { getNetworkDefaultModules, patchNetworkDefaultModules } from '@/lib/api/bot-module';
import { fetchUserManagedServers } from '@/lib/api/dashboard/servers';
import type {
  BotModuleFieldSchema,
  NetworkDefaultPayload,
  BotModuleValues,
  BotModulePatchRequest,
} from '@/lib/model/bot-module';
import type { ServerItem } from '@/lib/model/server';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { BotModulesAccordionDeck } from './BotModulesAccordionDeck';
import { NetworkParametersDeck } from './NetworkParametersDeck';
import { ModuleDisplayNamesDeck } from './ModuleDisplayNamesDeck';
import { NetworkKeyDisplayNamesDeck } from './NetworkKeyDisplayNamesDeck';

export type BotConfigTab = 'modules' | 'network' | 'moduleDisplayNames' | 'networkKeyDisplayNames';

export const NetworkBotConfigCoordinator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BotConfigTab>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const [schema, setSchema] = useState<NetworkDefaultPayload['schema']>({});
  const [initialModules, setInitialModules] = useState<Record<string, BotModuleValues>>({});
  const [currentModules, setCurrentModules] = useState<Record<string, BotModuleValues>>({});
  const [initialNetwork, setInitialNetwork] = useState<Record<string, unknown>>({});
  const [currentNetwork, setCurrentNetwork] = useState<Record<string, unknown>>({});

  const [initialModuleDisplayNames, setInitialModuleDisplayNames] = useState<Record<string, string>>({});
  const [currentModuleDisplayNames, setCurrentModuleDisplayNames] = useState<Record<string, string>>({});
  const [initialNetworkKeyDisplayNames, setInitialNetworkKeyDisplayNames] = useState<Record<string, string>>({});
  const [currentNetworkKeyDisplayNames, setCurrentNetworkKeyDisplayNames] = useState<Record<string, string>>({});

  const [managedServers, setManagedServers] = useState<ServerItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  let toast: ((msg: { title: string; type: 'success' | 'error' | 'info' | 'warning' }) => void) | undefined;
  try {
    const toastCtx = useToast();
    toast = toastCtx.toast;
  } catch {
    // Outside of ToastProvider
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const token = localStorage.getItem('accessToken') || undefined;

        const [modulesRes, serversRes] = await Promise.allSettled([
          getNetworkDefaultModules(token),
          fetchUserManagedServers(token),
        ]);

        if (!isMounted) return;

        if (serversRes.status === 'fulfilled' && serversRes.value.success && Array.isArray(serversRes.value.data)) {
          setManagedServers(serversRes.value.data);
        }

        if (modulesRes.status === 'fulfilled' && modulesRes.value.success && modulesRes.value.data) {
          setLoadError(null);
          const payload = modulesRes.value.data;
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

          const modNames = schemaData.moduleDisplayNames || {};
          setInitialModuleDisplayNames(JSON.parse(JSON.stringify(modNames)));
          setCurrentModuleDisplayNames(JSON.parse(JSON.stringify(modNames)));

          const netNames = schemaData.networkKeyDisplayNames || {};
          setInitialNetworkKeyDisplayNames(JSON.parse(JSON.stringify(netNames)));
          setCurrentNetworkKeyDisplayNames(JSON.parse(JSON.stringify(netNames)));
        } else {
          const msg =
            modulesRes.status === 'fulfilled'
              ? modulesRes.value.message
              : 'Failed to load network bot modules.';
          setLoadError(msg || 'Failed to load network bot modules.');
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

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleModuleFieldChange = useCallback(
    (modKey: string, fieldName: string, value: unknown) => {
      setCurrentModules((prev) => {
        const next = { ...prev };
        const currentMod = next[modKey] ? { ...next[modKey] } : {};
        currentMod[fieldName] = value;
        next[modKey] = currentMod;
        return next;
      });
    },
    []
  );

  const handleNetworkFieldChange = useCallback((key: string, value: unknown) => {
    setCurrentNetwork((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleModuleDisplayNameChange = useCallback((modKey: string, newDisplayName: string) => {
    setCurrentModuleDisplayNames((prev) => ({
      ...prev,
      [modKey]: newDisplayName,
    }));
  }, []);

  const handleNetworkKeyDisplayNameChange = useCallback((keyName: string, newDisplayName: string) => {
    setCurrentNetworkKeyDisplayNames((prev) => ({
      ...prev,
      [keyName]: newDisplayName,
    }));
  }, []);

  const dirtyModules = useMemo(() => {
    const diff: Record<string, Record<string, unknown>> = {};
    for (const [modKey, modValues] of Object.entries(currentModules)) {
      const initialMod = initialModules[modKey] || {};
      for (const [fName, fVal] of Object.entries(modValues)) {
        if (JSON.stringify(initialMod[fName]) !== JSON.stringify(fVal)) {
          if (!diff[modKey]) diff[modKey] = {};
          diff[modKey][fName] = fVal;
        }
      }
    }
    return diff;
  }, [currentModules, initialModules]);

  const dirtyNetwork = useMemo(() => {
    const diff: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(currentNetwork)) {
      if (JSON.stringify(initialNetwork[key]) !== JSON.stringify(val)) {
        diff[key] = val;
      }
    }
    return diff;
  }, [currentNetwork, initialNetwork]);

  const dirtyModNames = useMemo(() => {
    const diff: Record<string, string> = {};
    for (const [k, v] of Object.entries(currentModuleDisplayNames)) {
      if (initialModuleDisplayNames[k] !== v) {
        diff[k] = v;
      }
    }
    return diff;
  }, [currentModuleDisplayNames, initialModuleDisplayNames]);

  const dirtyNetNames = useMemo(() => {
    const diff: Record<string, string> = {};
    for (const [k, v] of Object.entries(currentNetworkKeyDisplayNames)) {
      if (initialNetworkKeyDisplayNames[k] !== v) {
        diff[k] = v;
      }
    }
    return diff;
  }, [currentNetworkKeyDisplayNames, initialNetworkKeyDisplayNames]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const fMap of Object.values(dirtyModules)) {
      count += Object.keys(fMap).length;
    }
    count += Object.keys(dirtyNetwork).length;
    count += Object.keys(dirtyModNames).length;
    count += Object.keys(dirtyNetNames).length;
    return count;
  }, [dirtyModules, dirtyNetwork, dirtyModNames, dirtyNetNames]);

  const isDirty = dirtyCount > 0;

  const handleReset = useCallback(() => {
    setCurrentModules(JSON.parse(JSON.stringify(initialModules)));
    setCurrentNetwork(JSON.parse(JSON.stringify(initialNetwork)));
    setCurrentModuleDisplayNames(JSON.parse(JSON.stringify(initialModuleDisplayNames)));
    setCurrentNetworkKeyDisplayNames(JSON.parse(JSON.stringify(initialNetworkKeyDisplayNames)));
    if (toast) {
      toast({
        title: 'Changes discarded',
        type: 'info',
      });
    }
  }, [initialModules, initialNetwork, initialModuleDisplayNames, initialNetworkKeyDisplayNames, toast]);

  const handleSave = async () => {
    if (!isDirty) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('accessToken') || undefined;

      const patchPayload: BotModulePatchRequest = {};

      if (Object.keys(dirtyModules).length > 0) {
        patchPayload.modules = dirtyModules;
      }

      if (Object.keys(dirtyNetwork).length > 0) {
        patchPayload.network = dirtyNetwork;
      }

      if (Object.keys(dirtyModNames).length > 0 || Object.keys(dirtyNetNames).length > 0) {
        patchPayload.schema = {
          ...(Object.keys(dirtyModNames).length > 0 ? { moduleDisplayNames: currentModuleDisplayNames } : {}),
          ...(Object.keys(dirtyNetNames).length > 0 ? { networkKeyDisplayNames: currentNetworkKeyDisplayNames } : {}),
        };
      }

      const res = await patchNetworkDefaultModules(patchPayload, token);

      if (res.success) {
        setInitialModules(JSON.parse(JSON.stringify(currentModules)));
        setInitialNetwork(JSON.parse(JSON.stringify(currentNetwork)));
        setInitialModuleDisplayNames(JSON.parse(JSON.stringify(currentModuleDisplayNames)));
        setInitialNetworkKeyDisplayNames(JSON.parse(JSON.stringify(currentNetworkKeyDisplayNames)));
        setSchema((prev) => ({
          ...prev,
          moduleDisplayNames: currentModuleDisplayNames,
          networkKeyDisplayNames: currentNetworkKeyDisplayNames,
        }));

        if (toast) {
          toast({
            title: 'Network defaults updated successfully',
            type: 'success',
          });
        }
      } else {
        throw new Error(res.message || 'Failed to update network defaults');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      if (toast) {
        toast({
          title: msg,
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const moduleCount = useMemo(() => {
    return Object.keys(currentModules || {}).length;
  }, [currentModules]);

  const networkCount = useMemo(() => {
    const keysFromSchema = Object.keys(schema?.networkKeys || {});
    const keysFromNetwork = Object.keys(currentNetwork || {});
    return new Set([...keysFromSchema, ...keysFromNetwork]).size;
  }, [schema, currentNetwork]);

  const moduleDisplayNamesCount = useMemo(() => {
    return Object.keys(currentModuleDisplayNames || {}).length;
  }, [currentModuleDisplayNames]);

  const networkKeyDisplayNamesCount = useMemo(() => {
    return Object.keys(currentNetworkKeyDisplayNames || {}).length;
  }, [currentNetworkKeyDisplayNames]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RngLoadingSpinner size="lg" />
        <span className="text-xs font-mono text-text-tertiary animate-pulse">
          Synchronizing network bot modules from JDA Gateway...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6">
        <div className="w-12 h-12 rounded-full bg-accent-danger/10 border border-accent-danger/20 flex items-center justify-center text-accent-danger">
          <AlertCircle size={24} />
        </div>
        <div className="flex flex-col items-center text-center max-w-md gap-1">
          <span className="text-sm font-semibold text-text-primary">
            Failed to Load Network Bot Modules
          </span>
          <span className="text-xs text-text-secondary">{loadError}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setReloadTrigger((p) => p + 1);
          }}
          className="px-4 py-2 rounded-apple-md bg-surface-elevated hover:bg-white/[0.04] border border-surface-border text-xs font-medium text-text-primary transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
              <Bot size={20} />
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
          <div className="flex items-center p-1 rounded-apple-lg bg-surface-canvas border border-surface-border shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
                {moduleCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
                {networkCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('moduleDisplayNames')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'moduleDisplayNames'
                  ? 'bg-brand-red text-white shadow-apple-card'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Type size={14} />
              <span>Module Display Names</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'moduleDisplayNames' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-tertiary'
                }`}
              >
                {moduleDisplayNamesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('networkKeyDisplayNames')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-apple-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'networkKeyDisplayNames'
                  ? 'bg-brand-red text-white shadow-apple-card'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
              }`}
            >
              <Sliders size={14} />
              <span>Network Keys Display Names</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'networkKeyDisplayNames' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-tertiary'
                }`}
              >
                {networkKeyDisplayNamesCount}
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

      {/* Main Content View */}
      {activeTab === 'modules' && (
        <BotModulesAccordionDeck
          modules={currentModules}
          schema={schema}
          searchQuery={searchQuery}
          onFieldChange={handleModuleFieldChange}
          disabled={isSaving}
        />
      )}

      {activeTab === 'network' && (
        <NetworkParametersDeck
          network={currentNetwork}
          schema={schema}
          searchQuery={searchQuery}
          onFieldChange={handleNetworkFieldChange}
          servers={managedServers}
          disabled={isSaving}
        />
      )}

      {activeTab === 'moduleDisplayNames' && (
        <ModuleDisplayNamesDeck
          moduleDisplayNames={currentModuleDisplayNames}
          schema={schema}
          searchQuery={searchQuery}
          onChangeDisplayName={handleModuleDisplayNameChange}
          disabled={isSaving}
        />
      )}

      {activeTab === 'networkKeyDisplayNames' && (
        <NetworkKeyDisplayNamesDeck
          networkKeyDisplayNames={currentNetworkKeyDisplayNames}
          schema={schema}
          searchQuery={searchQuery}
          onChangeDisplayName={handleNetworkKeyDisplayNameChange}
          disabled={isSaving}
        />
      )}

      {/* Bottom Sticky Unsaved Changes Bar */}
      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        message={`Careful — you have ${dirtyCount} unsaved configuration change${dirtyCount === 1 ? '' : 's'}.`}
        resetLabel="Discard"
      />
    </div>
  );
};
