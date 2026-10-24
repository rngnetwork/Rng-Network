'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bot, AlertCircle } from 'lucide-react';
import { getNetworkDefaultModules, patchNetworkDefaultModules } from '@/lib/api/bot-module';
import type { BotModuleSchema } from '@/lib/model/bot-module';
import { ModuleCard } from '@/components/dashboard/botconfig/ModuleCard';
import { useBotModuleForm } from '@/components/dashboard/botconfig/useBotModuleForm';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';

const DEFAULT_NETWORK_SCHEMA: BotModuleSchema = {
  automod: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    antiSpam: { type: 'BOOLEAN', label: 'Anti-Spam Filter' },
    muteDuration: { type: 'INTEGER', label: 'Mute Duration (Seconds)', min: 10, max: 3600 },
    punishment: { type: 'STRING', label: 'Violation Punishment', options: ['delete', 'mute', 'kick', 'ban'] },
    badWords: { type: 'JSON', label: 'Banned Words Filter' },
  },
  antinuke: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    loggingChannelId: { type: 'STRING', label: 'Audit Logging Channel' },
    adminThreshold: { type: 'INTEGER', label: 'Admin Action Threshold', min: 1, max: 50 },
  },
  ticket: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    categoryId: { type: 'STRING', label: 'Ticket Channel Category' },
    supportRoleId: { type: 'STRING', label: 'Support Team Role' },
  },
  leveling: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    xpRate: { type: 'INTEGER', label: 'XP Multiplier', min: 1, max: 10 },
    announcementChannelId: { type: 'STRING', label: 'Level-Up Announcement Channel' },
    levelRoles: { type: 'JSON', label: 'Level Milestone Role Rewards' },
  },
  economy: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    currencyName: { type: 'STRING', label: 'Currency Symbol / Name' },
    dailyReward: { type: 'INTEGER', label: 'Daily Currency Reward', min: 10, max: 10000 },
  },
  giveaway: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    giveawayChannelId: { type: 'STRING', label: 'Default Giveaway Channel' },
  },
  logging: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    logChannelId: { type: 'STRING', label: 'Central Log Channel' },
  },
  verification: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    verifiedRoleId: { type: 'STRING', label: 'Verified Member Role' },
  },
  reactionrole: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
  },
  welcome: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    welcomeChannelId: { type: 'STRING', label: 'Welcome Channel' },
  },
  music: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    defaultVolume: { type: 'INTEGER', label: 'Default Volume Percentage', min: 1, max: 100 },
  },
  customcommands: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
  },
  invitetracker: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
  },
  starboard: {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    starboardChannelId: { type: 'STRING', label: 'Starboard Channel' },
    threshold: { type: 'INTEGER', label: 'Minimum Reaction Threshold', min: 1, max: 50 },
  },
};

export default function BotConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schema] = useState<BotModuleSchema>(DEFAULT_NETWORK_SCHEMA);

  let toast: ((msg: { title: string; type: 'success' | 'error' | 'info' | 'warning' }) => void) | undefined;
  try {
    const toastCtx = useToast();
    toast = toastCtx.toast;
  } catch {
    // Outside of ToastProvider
  }

  const {
    currentModules,
    initModules,
    updateField,
    resetAll,
    commitPristine,
    dirtyPayload,
    isDirty,
    dirtyCount,
    isSaving,
    setIsSaving,
  } = useBotModuleForm({ initialModules: {} });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const token = localStorage.getItem('accessToken') || undefined;
        const res = await getNetworkDefaultModules(token);

        if (isMounted) {
          if (res.success && res.data) {
            initModules(res.data);
          } else {
            setLoadError(res.message || 'Failed to load network bot modules.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to connect to backend service';
          setLoadError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [initModules]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('accessToken') || undefined;
      const res = await patchNetworkDefaultModules(dirtyPayload, token);

      if (res.success) {
        commitPristine();
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

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const moduleNames = Object.keys(schema);

    return moduleNames
      .map((name) => {
        const modSchema = schema[name] || {};
        const modValues = currentModules[name] || {};

        if (!query) {
          return { name, schema: modSchema, values: modValues, isMatch: true, highlightMatch: false };
        }

        const nameMatch = name.toLowerCase().includes(query);
        let fieldMatch = false;

        for (const [fieldName, field] of Object.entries(modSchema)) {
          if (fieldName.toLowerCase().includes(query)) {
            fieldMatch = true;
            break;
          }
          if (field.label && field.label.toLowerCase().includes(query)) {
            fieldMatch = true;
            break;
          }
        }

        return {
          name,
          schema: modSchema,
          values: modValues,
          isMatch: nameMatch || fieldMatch,
          highlightMatch: !nameMatch && fieldMatch,
        };
      })
      .filter((m) => m.isMatch);
  }, [searchQuery, schema, currentModules]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RngLoadingSpinner size="lg" />
        <span className="text-xs font-mono text-zinc-400">Loading network module configurations...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 max-w-md mx-auto text-center px-4">
        <div className="w-10 h-10 rounded-full bg-accent-danger/10 border border-accent-danger/30 flex items-center justify-center text-accent-danger">
          <AlertCircle size={20} />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">Unable to load modules</h2>
        <p className="text-xs text-zinc-400 font-mono">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 md:px-8 py-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-apple-sm bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Bot size={15} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Network Bot Modules
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Network-wide bot module defaults applied across all connected servers.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules and settings..."
            className="w-full pl-9 pr-3 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-brand-red/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => (
          <ModuleCard
            key={mod.name}
            moduleName={mod.name}
            schema={mod.schema}
            values={mod.values}
            onChange={updateField}
            isNetworkDeck={true}
            isOverridden={true}
            highlightMatch={mod.highlightMatch}
          />
        ))}
      </div>

      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={resetAll}
        message={`You have unsaved changes in ${dirtyCount} module${dirtyCount === 1 ? '' : 's'}.`}
      />
    </div>
  );
}
