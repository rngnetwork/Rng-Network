"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronsUpDown,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Gavel,
  Volume2,
  UserPlus,
  Ticket,
  Zap,
  Coins,
  FileText,
  BadgeCheck,
  Gift,
  Briefcase
} from 'lucide-react';
import { BotModule, DiscordChannelOption, DiscordRoleOption } from './types';
import { SubmoduleAccordion } from './SubmoduleAccordion';
import { Toggle } from '@/components/ui/Toggle';

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  ShieldCheck,
  Gavel,
  Volume2,
  UserPlus,
  Ticket,
  Zap,
  Coins,
  FileText,
  BadgeCheck,
  Gift,
  Briefcase,
};

interface ModuleDetailProps {
  module: BotModule;
  onBack: () => void;
  onToggleMaster: (enabled: boolean) => void;
  onToggleSubmodule: (submoduleId: string, enabled: boolean) => void;
  onFieldChange: (submoduleId: string, fieldId: string, value: any) => void;
  channels: DiscordChannelOption[];
  roles: DiscordRoleOption[];
}

export function ModuleDetail({
  module,
  onBack,
  onToggleMaster,
  onToggleSubmodule,
  onFieldChange,
  channels,
  roles,
}: ModuleDetailProps) {
  // Track open state for each submodule (default: open first submodule)
  const [openSubmodules, setOpenSubmodules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (module.submodules.length > 0) {
      initial[module.submodules[0].id] = true;
    }
    return initial;
  });

  const IconComp = ICON_MAP[module.icon] || Sparkles;

  const handleToggleOpen = (submoduleId: string) => {
    setOpenSubmodules((prev) => ({
      ...prev,
      [submoduleId]: !prev[submoduleId],
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    module.submodules.forEach((s) => {
      next[s.id] = true;
    });
    setOpenSubmodules(next);
  };

  const handleCollapseAll = () => {
    setOpenSubmodules({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 md:gap-8 w-full"
    >
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs md:text-sm font-semibold text-zinc-300 hover:text-white transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-red-400" />
          <span>Back to Modules</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
          >
            <ChevronsUpDown size={13} />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 hover:text-white transition-all"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Module Workspace Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-black/40 border border-white/10 relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        {/* Glow Accent in corner */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-start md:items-center gap-4 md:gap-5 min-w-0 relative z-10">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_25px_rgba(225,29,46,0.35)]">
            <IconComp size={30} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {module.name}
              </h2>
              {module.badge && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-semibold">
                  {module.badge}
                </span>
              )}
            </div>

            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {module.description}
            </p>
          </div>
        </div>

        {/* Master Module Switch */}
        <div className="flex items-center justify-between md:justify-end gap-4 p-4 md:p-0 rounded-2xl md:rounded-none bg-white/[0.02] md:bg-transparent border md:border-none border-white/5 relative z-10 shrink-0">
          <div className="flex flex-col md:text-right">
            <span className="text-xs font-mono font-semibold uppercase text-zinc-300 tracking-wider">
              Master System Switch
            </span>
            <span className="text-[11px] text-zinc-400">
              {module.enabled ? 'Module active on server' : 'Module is completely disabled'}
            </span>
          </div>

          <Toggle
            checked={module.enabled}
            onChange={onToggleMaster}
          />
        </div>
      </div>

      {/* Accordion Stack of Submodules */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Submodules & Config Drawers ({module.submodules.length})
          </h3>
        </div>

        <div className="flex flex-col gap-3.5">
          {module.submodules.map((submodule) => (
            <SubmoduleAccordion
              key={submodule.id}
              submodule={submodule}
              isOpen={Boolean(openSubmodules[submodule.id])}
              onToggleOpen={() => handleToggleOpen(submodule.id)}
              onToggleEnabled={(enabled) => onToggleSubmodule(submodule.id, enabled)}
              onFieldChange={(fieldId, val) => onFieldChange(submodule.id, fieldId, val)}
              channels={channels}
              roles={roles}
              disabled={!module.enabled}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
