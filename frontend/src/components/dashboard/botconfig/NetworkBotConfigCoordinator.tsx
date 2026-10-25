'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Bot, Globe, AlertCircle } from 'lucide-react';
import { getNetworkDefaultModules, patchNetworkDefaultModules } from '@/lib/api/bot-module';
import { fetchUserManagedServers } from '@/lib/api/dashboard/servers';
import type {
  BotModuleFieldSchema,
  NetworkDefaultPayload,
  BotModuleValues,
} from '@/lib/model/bot-module';
import type { ServerItem } from '@/lib/model/server';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { BotModulesAccordionDeck } from './BotModulesAccordionDeck';
import { NetworkParametersDeck } from './NetworkParametersDeck';

export const NetworkBotConfigCoordinator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'network'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const [schema, setSchema] = useState<NetworkDefaultPayload['schema']>({});
  const [initialModules, setInitialModules] = useState<Record<string, BotModuleValues>>({});
  const [currentModules, setCurrentModules] = useState<Record<string, BotModuleValues>>({});
  const [initialNetwork, setInitialNetwork] = useState<Record<string, unknown>>({});
  const [currentNetwork, setCurrentNetwork] = useState<Record<string, unknown>>({});
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

  const { dirtyModules, dirtyNetwork, dirtyCount, isDirty } = useMemo(() => {
    const dirtyMods: Record<string, Record<string, unknown>> = {};
    let count = 0;

    for (const [modKey, modValues] of Object.entries(currentModules)) {
      const initModValues = initialModules[modKey] || {};
      for (const [fName, fVal] of Object.entries(modValues)) {
        const initVal = initModValues[fName];
        if (JSON.stringify(fVal) !== JSON.stringify(initVal)) {
          if (!dirtyMods[modKey]) {
            dirtyMods[modKey] = {};
          }
          dirtyMods[modKey][fName] = fVal;
          count++;
        }
      }
    }

    const dirtyNet: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(currentNetwork)) {
      const initVal = initialNetwork[k];
      if (JSON.stringify(val) !== JSON.stringify(initVal)) {
        dirtyNet[k] = val;
        count++;
      }
    }

    return {
      dirtyModules: dirtyMods,
      dirtyNetwork: dirtyNet,
      dirtyCount: count,
      isDirty: count > 0,
    };
  }, [currentModules, initialModules, currentNetwork, initialNetwork]);

  const handleReset = useCallback(() => {
    setCurrentModules(JSON.parse(JSON.stringify(initialModules)));
    setCurrentNetwork(JSON.parse(JSON.stringify(initialNetwork)));
  }, [initialModules, initialNetwork]);

  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving) return;
    try {
      setIsSaving(true);
      const token = localStorage.getItem('accessToken') || undefined;

      const patchPayload = {
        modules: Object.keys(dirtyModules).length > 0 ? dirtyModules : undefined,
        network: Object.keys(dirtyNetwork).length > 0 ? dirtyNetwork : undefined,
      };

      const res = await patchNetworkDefaultModules(patchPayload, token);

      if (res.success) {
        setInitialModules(JSON.parse(JSON.stringify(currentModules)));
        setInitialNetwork(JSON.parse(JSON.stringify(currentNetwork)));
        toast?.({ title: 'Network default bot configuration saved successfully.', type: 'success' });
      } else {
        toast?.({ title: res.message || 'Failed to save network configuration.', type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save error';
      toast?.({ title: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, dirtyModules, dirtyNetwork, currentModules, currentNetwork, toast]);

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
          className="px-4 py-2 rounded-apple-md bg-surface-elevated border border-surface-border text-xs text-text-primary hover:border-brand-red transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const moduleCount = Object.keys(schema?.modules || currentModules).length;
  const networkCount = Object.keys(currentNetwork).length;

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
                {moduleCount}
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
                {networkCount}
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
      {activeTab === 'modules' ? (
        <BotModulesAccordionDeck
          modules={currentModules}
          schema={schema}
          searchQuery={searchQuery}
          onFieldChange={handleModuleFieldChange}
          disabled={isSaving}
        />
      ) : (
        <NetworkParametersDeck
          network={currentNetwork}
          schema={schema}
          searchQuery={searchQuery}
          onFieldChange={handleNetworkFieldChange}
          servers={managedServers}
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
