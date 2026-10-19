"use client";

import React, { useState } from 'react';
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
    <div className="flex flex-col gap-5 sm:gap-6 md:gap-7 w-full">
      {/* Top action bar: Responsive on mobile & desktop */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} className="text-red-400" />
          <span>Back to Modules</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl bg-[#0d0e12] hover:bg-white/5 active:scale-95 border border-white/10 text-[11px] font-mono text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronsUpDown size={13} />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 rounded-xl bg-[#0d0e12] hover:bg-white/5 active:scale-95 border border-white/10 text-[11px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Module Workspace Header Banner: 100% Mobile Responsive */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#121318] via-[#0d0e12] to-[#0a0a0d] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_18px_rgba(225,29,46,0.3)]">
            <IconComp size={26} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                {module.name}
              </h2>
              {module.badge && (
                <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-semibold">
                  {module.badge}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {module.description}
            </p>
          </div>
        </div>

        {/* Master Module Switch Card on Mobile, Inline on Desktop */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 p-3.5 sm:p-4 md:p-0 rounded-xl sm:rounded-2xl md:rounded-none bg-white/[0.03] md:bg-transparent border md:border-none border-white/5 shrink-0">
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

      {/* Accordion Stack of Submodules: Unrestricted Native Scrolling */}
      <div className="flex flex-col gap-3 sm:gap-3.5 pb-20">
        <div className="flex items-center justify-between pb-0.5">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Submodules & Config Drawers ({module.submodules.length})
          </h3>
        </div>

        <div className="flex flex-col gap-3 sm:gap-3.5">
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
    </div>
  );
}
