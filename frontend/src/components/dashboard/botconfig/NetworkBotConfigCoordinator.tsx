'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Bot, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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

export type BotConfigTab = 'modules' | 'network';

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

  const dirtyModules = useMemo(() => {
    const diff: Record<string, Record<string, unknown>> = {};
    for (const [modKey, modValues] of Object.entries(currentModules)) {
      const initialMod = initialModules[modKey] || {};
      const modSchema = (schema as any)?.modules?.[modKey] || (schema as any)?.[modKey];
      for (const [fName, fVal] of Object.entries(modValues)) {
        const fieldDef = modSchema?.[fName];
        if (fieldDef?.readOnly === true) {
          continue;
        }
        if (JSON.stringify(initialMod[fName]) !== JSON.stringify(fVal)) {
          if (!diff[modKey]) diff[modKey] = {};
          diff[modKey][fName] = fVal;
        }
      }
    }
    return diff;
  }, [currentModules, initialModules, schema]);

  const dirtyNetwork = useMemo(() => {
    const diff: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(currentNetwork)) {
      if (JSON.stringify(initialNetwork[key]) !== JSON.stringify(val)) {
        diff[key] = val;
      }
    }
    return diff;
  }, [currentNetwork, initialNetwork]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const fMap of Object.values(dirtyModules)) {
      count += Object.keys(fMap).length;
    }
    count += Object.keys(dirtyNetwork).length;
    return count;
  }, [dirtyModules, dirtyNetwork]);

  const isDirty = dirtyCount > 0;

  const handleReset = useCallback(() => {
    setCurrentModules(JSON.parse(JSON.stringify(initialModules)));
    setCurrentNetwork(JSON.parse(JSON.stringify(initialNetwork)));
    if (toast) {
      toast({
        title: 'Changes discarded',
        type: 'info',
      });
    }
  }, [initialModules, initialNetwork, toast]);

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

      const res = await patchNetworkDefaultModules(patchPayload, token);

      if (res.success) {
        setInitialModules(JSON.parse(JSON.stringify(currentModules)));
        setInitialNetwork(JSON.parse(JSON.stringify(currentNetwork)));

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

  const tabs = [
    {
      id: 'modules' as const,
      label: 'Bot Modules',
      icon: Bot,
      count: moduleCount,
    },
    {
      id: 'network' as const,
      label: 'Network Parameters',
      icon: Globe,
      count: networkCount,
    },
  ];

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
      <div className="flex flex-col gap-5 border-b border-surface-border pb-6">
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

        <nav
          aria-label="Bot configuration workspace tabs"
          className="relative border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto pb-2.5 scrollbar-none"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap rounded-apple-md transition-all duration-200 min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-crimson-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-brand-red' : 'text-zinc-500'} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-brand-red/20 text-brand-red' : 'bg-surface-elevated text-text-tertiary'
                  }`}
                >
                  {tab.count}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="botconfigActiveTabIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-brand-red"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules and settings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-apple-lg bg-[#0E0E12] border border-surface-border text-xs md:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/40 transition-all shadow-inner"
          />
        </div>
      </div>

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
