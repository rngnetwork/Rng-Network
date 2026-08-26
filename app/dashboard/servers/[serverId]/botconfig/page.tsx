"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Shield,
  MessageSquare,
  Users,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function BotConfigPage() {
  const [modules, setModules] = useState([
    { name: 'Moderation & AutoMod', enabled: true, category: 'Security', icon: Shield },
    { name: 'Application System', enabled: true, category: 'Administration', icon: Users },
    { name: 'Verification & Gatekeeper', enabled: true, category: 'Security', icon: Shield },
    { name: 'Anti-Nuke & Raid Shield', enabled: true, category: 'Security', icon: Shield },
    { name: 'Audit & Action Logging', enabled: true, category: 'Core', icon: Zap },
    { name: 'Ticket Support Center', enabled: true, category: 'Community', icon: MessageSquare },
    { name: 'Economy System', enabled: false, category: 'Engagement', icon: Zap },
    { name: 'Finance & Treasury', enabled: true, category: 'Administration', icon: Zap },
    { name: 'Giveaways & Drops', enabled: false, category: 'Engagement', icon: Zap },
    { name: 'Events & Tournaments', enabled: true, category: 'Engagement', icon: Users },
    { name: 'Welcome & Onboarding', enabled: true, category: 'Core', icon: MessageSquare },
    { name: 'Staff Management', enabled: true, category: 'Administration', icon: Users },
    { name: 'Tasks & Delegations', enabled: false, category: 'Administration', icon: Zap },
    { name: 'Custom Dynamic Commands', enabled: false, category: 'Core', icon: Bot },
    { name: 'Voice Hub Channels', enabled: true, category: 'Community', icon: MessageSquare }
  ]);

  const [savedToast, setSavedToast] = useState(false);

  const toggleModule = (index: number) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], enabled: !next[index].enabled };
      return next;
    });
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0a180f]/95 border border-emerald-500/40 text-white shadow-[0_0_25px_rgba(52,211,153,0.25)] backdrop-blur-2xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">Bot module configuration synchronized!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            Bot Engine & Submodule Configuration
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Toggle features on or off for this specific guild.
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-mono w-fit">
          {modules.filter((m) => m.enabled).length}/{modules.length} Modules Active
        </span>
      </div>

      {/* 15 Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.name}
              className={`p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                mod.enabled
                  ? 'bg-red-500/[0.04] border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.08)]'
                  : 'bg-white/[0.02] border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-xl border ${
                    mod.enabled
                      ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(225,29,46,0.2)]'
                      : 'bg-white/5 border-white/10 text-zinc-500'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{mod.name}</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                    {mod.category}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleModule(idx)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 p-0.5 ${
                  mod.enabled ? 'bg-red-600' : 'bg-zinc-800'
                }`}
              >
                <motion.div
                  animate={{ x: mod.enabled ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] text-white font-bold text-sm shadow-[0_0_20px_rgba(225,29,46,0.35)] hover:shadow-[0_0_35px_rgba(225,29,46,0.7)] border border-red-400/30 transition-all duration-300"
        >
          Save Module Configuration
        </button>
      </div>
    </motion.div>
  );
}
