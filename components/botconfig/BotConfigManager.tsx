"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BotModule, DiscordChannelOption, DiscordRoleOption } from './types';
import {
  fetchBotModules,
  updateBotModule,
  toggleBotModule,
  fetchDiscordChannels,
  fetchDiscordRoles,
} from './mockapi';
import { ModuleGrid } from './ModuleGrid';
import { ModuleDetail } from './ModuleDetail';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';

interface BotConfigManagerProps {
  serverId: string;
}

export function BotConfigManager({ serverId }: BotConfigManagerProps) {
  const [modules, setModules] = useState<BotModule[]>([]);
  const [initialModules, setInitialModules] = useState<BotModule[]>([]);
  const [channels, setChannels] = useState<DiscordChannelOption[]>([]);
  const [roles, setRoles] = useState<DiscordRoleOption[]>([]);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load modules, channels, and roles
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [mods, chs, rls] = await Promise.all([
          fetchBotModules(serverId),
          fetchDiscordChannels(serverId),
          fetchDiscordRoles(serverId),
        ]);

        if (isMounted) {
          setModules(mods);
          setInitialModules(JSON.parse(JSON.stringify(mods)));
          setChannels(chs);
          setRoles(rls);
        }
      } catch (err: any) {
        if (isMounted) {
          setToastMessage({
            type: 'error',
            text: err?.message || 'Failed to load bot modules.',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  // Deep comparison for dirty state
  const isDirty = useMemo(() => {
    if (!initialModules || initialModules.length === 0) return false;
    return JSON.stringify(modules) !== JSON.stringify(initialModules);
  }, [modules, initialModules]);

  // Handle Quick Master Toggle on Module Card (or inside Detail)
  const handleToggleModule = useCallback(
    async (moduleId: string, enabled: boolean) => {
      // Optimistic update
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, enabled } : m))
      );

      setUpdatingModuleId(moduleId);
      try {
        await toggleBotModule(serverId, moduleId, enabled);
        // Also update initialModules for the master toggle so it doesn't trigger dirty state if intended as a direct toggle
        setInitialModules((prev) =>
          prev.map((m) => (m.id === moduleId ? { ...m, enabled } : m))
        );
      } catch (err: any) {
        // Revert on error
        setModules((prev) =>
          prev.map((m) => (m.id === moduleId ? { ...m, enabled: !enabled } : m))
        );
        setToastMessage({
          type: 'error',
          text: `Failed to toggle module: ${err?.message || 'Network error'}`,
        });
      } finally {
        setUpdatingModuleId(null);
      }
    },
    [serverId]
  );

  // Handle Submodule Master Toggle
  const handleToggleSubmodule = useCallback(
    (submoduleId: string, enabled: boolean) => {
      if (!selectedModuleId) return;

      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== selectedModuleId) return m;
          const nextSubmodules = m.submodules.map((s) =>
            s.id === submoduleId ? { ...s, enabled } : s
          );
          return { ...m, submodules: nextSubmodules };
        })
      );
    },
    [selectedModuleId]
  );

  // Handle Field Value Mutation
  const handleFieldChange = useCallback(
    (submoduleId: string, fieldId: string, value: any) => {
      if (!selectedModuleId) return;

      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== selectedModuleId) return m;
          const nextSubmodules = m.submodules.map((s) => {
            if (s.id !== submoduleId) return s;
            const nextFields = s.fields.map((f) =>
              f.id === fieldId ? { ...f, value } : f
            );
            return { ...s, fields: nextFields };
          }) as any;
          return { ...m, submodules: nextSubmodules };
        })
      );
    },
    [selectedModuleId]
  );

  // Save changes via API
  const handleSave = async () => {
    setIsSaving(true);
    setToastMessage(null);

    try {
      // Find modified modules and persist
      const modifiedModules = modules.filter((mod, idx) => {
        const initial = initialModules[idx];
        return JSON.stringify(mod) !== JSON.stringify(initial);
      });

      for (const mod of modifiedModules) {
        await updateBotModule(serverId, mod.id, mod);
      }

      setInitialModules(JSON.parse(JSON.stringify(modules)));
      setToastMessage({
        type: 'success',
        text: 'Bot module settings saved and applied successfully!',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Error saving bot configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setModules(JSON.parse(JSON.stringify(initialModules)));
    setToastMessage(null);
  };

  // Find currently selected module object
  const activeModule = useMemo(() => {
    if (!selectedModuleId) return null;
    return modules.find((m) => m.id === selectedModuleId) || null;
  }, [modules, selectedModuleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
        <span className="text-xs font-mono text-zinc-400">Loading Bot Modules...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs md:text-sm flex items-center gap-3 shadow-lg ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-red-950/80 border border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Switcher: Grid vs Detail */}
      {activeModule ? (
        <ModuleDetail
          module={activeModule}
          onBack={() => setSelectedModuleId(null)}
          onToggleMaster={(enabled) => handleToggleModule(activeModule.id, enabled)}
          onToggleSubmodule={handleToggleSubmodule}
          onFieldChange={handleFieldChange}
          channels={channels}
          roles={roles}
        />
      ) : (
        <ModuleGrid
          modules={modules}
          onSelectModule={(id) => setSelectedModuleId(id)}
          onToggleModule={handleToggleModule}
          isUpdatingModuleId={updatingModuleId}
        />
      )}

      {/* Floating Unsaved Changes Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        message="Careful — you have unsaved bot module configurations!"
      />
    </div>
  );
}
