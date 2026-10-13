'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Network, Zap, Shield, Search } from 'lucide-react';
import { CyberWebCanvas } from './CyberWebCanvas';
import { CyberNodeCard } from './CyberNodeCard';
import { CYBER_NODES, type CyberNode } from './cyberWebData';

export const CyberWebCoordinator: React.FC = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = CYBER_NODES.filter((n) => n.status === 'active').length;
  const lockedCount = CYBER_NODES.filter((n) => n.status === 'locked').length;

  const filteredNodes = CYBER_NODES.filter((node) => {
    if (filter === 'active' && node.status !== 'active') return false;
    if (filter === 'locked' && node.status !== 'locked') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = node.name.toLowerCase().includes(q);
      const matchSub = node.subtitle.toLowerCase().includes(q);
      const matchTags = node.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchSub || matchTags;
    }
    return true;
  });

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] rounded-apple-2xl overflow-hidden border border-white/[0.08] bg-[#050508] p-4 sm:p-6 md:p-8 flex flex-col justify-between">
      {/* 3D Cybernetic Neural Canvas Background */}
      <CyberWebCanvas />

      {/* Cyber Grid Overlay Grid Lines */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red shadow-glow" />
              </span>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand-red">
                RNG Neural Cyber Web · Command Constellation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Command Overview
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Interactive cybernetic neural mesh connecting live microservices, clearance registries, and
              autonomous Components V2 dispatch clusters.
            </p>
          </div>

          {/* Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>NEURAL MESH ACTIVE</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red text-xs font-mono font-bold flex items-center gap-1.5 shadow-glow">
              <Zap size={13} className="animate-pulse" />
              <span>{activeCount} / 9 LIVE NODES</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-xs font-mono flex items-center gap-1.5">
              <Shield size={13} className="text-zinc-500" />
              <span>CLEARANCE: MILITARY</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-apple-sm text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                filter === 'all'
                  ? 'bg-brand-red text-white shadow-glow'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All Nodes ({CYBER_NODES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-apple-sm text-xs font-mono font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                filter === 'active'
                  ? 'bg-brand-red text-white shadow-glow'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Active * ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('locked')}
              className={`px-3 py-1.5 rounded-apple-sm text-xs font-mono font-semibold transition-all duration-200 cursor-pointer ${
                filter === 'locked'
                  ? 'bg-brand-red text-white shadow-glow'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Offline / Locked ({lockedCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search neural node..."
              className="w-full bg-[#0D0E12]/80 border border-white/10 rounded-apple-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all font-mono"
            />
          </div>
        </div>

        {/* Neural Nodes Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
        >
          {filteredNodes.map((node) => (
            <CyberNodeCard key={node.id} node={node} onNavigate={handleNavigate} />
          ))}
        </motion.div>
      </div>

      {/* Cyber Mesh Status Footer */}
      <div className="relative z-10 mt-8 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-mono gap-2">
        <div className="flex items-center gap-2">
          <Network size={14} className="text-brand-red" />
          <span>RNG PROTOCOL V2 · SECURE TOPOLOGY DISPATCH READY</span>
        </div>
        <div>
          <span>NODES MARKED WITH (*) FEATURE DEDICATED COMMAND CONTROL ROUTING</span>
        </div>
      </div>
    </div>
  );
};
