"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Hash, Bot, ChevronUp, ChevronDown } from 'lucide-react';
export interface ServerStatsData {
  id: string;
  name: string;
  icon?: string | null;
  iconUrl?: string | null;
  shortName?: string;
  boostLevel: number;
  boostCount: number;
  onlineCount: number;
  totalCount: number;
}

interface ServerStatsHeaderProps {
  server: ServerStatsData;
}

export function ServerStatsHeader({ server }: ServerStatsHeaderProps) {
  const avatarSrc = server.iconUrl || server.icon;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rng_server_header_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rng_server_header_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-tl from-[#2A050A]/90 via-[#101010] to-[#0A0A0A] border border-red-500/20 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,46,0.15)] transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Collapse / Expand Toggle Button in Top-Right Corner */}
      <button
        type="button"
        onClick={toggleCollapse}
        title={isCollapsed ? "Expand server overview" : "Collapse server overview"}
        aria-label={isCollapsed ? "Expand server overview" : "Collapse server overview"}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-xl bg-black/50 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-white transition-all shadow-md group cursor-pointer"
      >
        {isCollapsed ? (
          <ChevronDown size={16} className="transition-transform group-hover:translate-y-0.5 text-zinc-300 group-hover:text-red-400" />
        ) : (
          <ChevronUp size={16} className="transition-transform group-hover:-translate-y-0.5 text-zinc-300 group-hover:text-red-400" />
        )}
      </button>

      <AnimatePresence initial={false} mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 px-6 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-10">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-red-500/40 bg-black/60 shrink-0 flex items-center justify-center">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={server.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-white font-mono">
                    {server.shortName || server.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                {server.name}
              </h2>
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                <span>{server.onlineCount} Online</span>
                <span className="text-zinc-600">|</span>
                <span>{server.totalCount} Members</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pr-8">
              <div className="flex items-center gap-5 md:gap-7 min-w-0">
                {/* Enlarged Logo with rounded square shape on the left */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-red-500/40 bg-black/60 shadow-[0_0_30px_rgba(225,29,46,0.35)] shrink-0 flex items-center justify-center">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={server.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl md:text-2xl font-bold text-white font-mono tracking-wider drop-shadow-md">
                      {server.shortName || server.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Server Details */}
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                      {server.name}
                    </h1>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(225,29,46,0.2)]">
                      <Flame size={12} className="text-red-400" />
                      {server.boostLevel > 0 ? `Level ${server.boostLevel} (${server.boostCount} Boosts)` : 'No Boosts'}
                    </span>
                  </div>

                  {/* Red dot showing Online + Adjacent Total Members */}
                  <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs md:text-sm">
                    <div className="flex items-center gap-2 font-mono font-semibold text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse" />
                      <span>{server.onlineCount} Online</span>
                    </div>

                    <span className="text-zinc-600">|</span>

                    <div className="text-zinc-300 font-mono font-medium">
                      Total Members: <span className="text-white font-bold">{server.totalCount}</span>
                    </div>

                    <span className="text-zinc-600 hidden sm:inline">|</span>

                    <div className="text-emerald-400 font-mono text-xs hidden sm:flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Bot size={12} />
                      <span>Bot Active</span>
                    </div>

                    <span className="text-zinc-600 hidden sm:inline">|</span>

                    <div className="text-zinc-400 font-mono text-xs hidden sm:flex items-center gap-1">
                      <Hash size={12} className="text-red-400" />
                      <span>ID: {server.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
