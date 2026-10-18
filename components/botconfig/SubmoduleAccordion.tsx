"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Submodule, DiscordChannelOption, DiscordRoleOption } from './types';
import { Toggle } from '@/components/ui/Toggle';
import { ASTFieldRenderer } from './renderers/ASTFieldRenderer';

interface SubmoduleAccordionProps {
  submodule: Submodule;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: any) => void;
  channels: DiscordChannelOption[];
  roles: DiscordRoleOption[];
  disabled?: boolean;
}

export function SubmoduleAccordion({
  submodule,
  isOpen,
  onToggleOpen,
  onToggleEnabled,
  onFieldChange,
  channels,
  roles,
  disabled = false,
}: SubmoduleAccordionProps) {
  // Dynamically resolve icon from Lucide if available
  const IconComponent = submodule.icon && (LucideIcons as any)[submodule.icon]
    ? (LucideIcons as any)[submodule.icon]
    : Sparkles;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? 'bg-black/50 border-red-500/40 shadow-[0_0_25px_rgba(225,29,46,0.18)]'
          : 'bg-black/30 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={onToggleOpen}
        className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              submodule.enabled
                ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(225,29,46,0.25)]'
                : 'bg-zinc-900 border-white/5 text-zinc-500'
            }`}
          >
            <IconComponent size={20} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm md:text-base font-bold text-white tracking-tight truncate">
                {submodule.title}
              </span>

              {submodule.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                  {submodule.badge}
                </span>
              )}

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  submodule.enabled
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {submodule.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1 line-clamp-1 leading-relaxed">
              {submodule.description}
            </p>
          </div>
        </div>

        {/* Right side controls: Toggle & Expand Chevron */}
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Toggle
            checked={submodule.enabled}
            onChange={onToggleEnabled}
            disabled={disabled}
          />

          <button
            type="button"
            onClick={onToggleOpen}
            className={`p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all ${
              isOpen ? 'rotate-180 text-red-400' : ''
            }`}
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Accordion Content Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 md:p-6 border-t border-white/10 bg-black/30 flex flex-col gap-5">
              {!submodule.enabled && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
                  <span>This submodule is currently inactive. Toggle it on to activate its rules on your server.</span>
                </div>
              )}

              <div
                className={`flex flex-col gap-5 transition-opacity ${
                  submodule.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
                }`}
              >
                {submodule.fields.map((field) => (
                  <ASTFieldRenderer
                    key={field.id}
                    field={field}
                    allFields={submodule.fields}
                    channels={channels}
                    roles={roles}
                    onChange={onFieldChange}
                    disabled={disabled || !submodule.enabled}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
