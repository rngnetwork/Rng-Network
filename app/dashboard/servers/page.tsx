"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Server,
  Users,
  Activity,
  ArrowRight,
  Bot,
  Flame,
  AlertCircle
} from 'lucide-react';
import { api, ServerItem } from '@/lib/api';

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadServers = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await api.fetchServers(token);
        if (isMounted) {
          if (res.success && res.data) {
            setServers(res.data);
          } else {
            setError(res.message || 'Failed to load Discord servers.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Network error loading servers.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleManageServer = (server: ServerItem) => {
    router.push(`/dashboard/servers/${server.slug || server.id}/settings`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-[#111111]/70 border border-red-500/30 text-center max-w-lg mx-auto">
        <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Servers</h2>
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(225,29,46,0.3)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(225,29,46,0.25)]">
            <Server size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Server Management
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                {servers.length} Servers
              </span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              Manage Discord guilds and bot configurations across RNG Network.
            </p>
          </div>
        </div>
      </div>

      {/* Servers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {servers.map((server, index) => {
          return (
            <motion.div
              key={server.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.06,
                ease: "easeOut"
              }}
              whileHover={{ y: -2 }}
              className="group relative rounded-3xl p-6 md:p-7 transition-all duration-300 overflow-hidden border border-red-500/20 hover:border-red-500/50 bg-gradient-to-tl from-[#220306]/90 via-[#0e0e0e] to-[#080808] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_25px_rgba(225,29,46,0.12)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_45px_rgba(225,29,46,0.35)] flex flex-col justify-between h-full"
            >
              {/* Red glow accent in bottom right */}
              <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-red-600/15 blur-3xl rounded-full pointer-events-none group-hover:bg-red-600/25 transition-all duration-500" />

              <div className="flex flex-col flex-1 justify-between">
                {/* Server Top Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Server Avatar / Logo */}
                    <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border border-red-500/30 bg-black/60 shadow-[0_0_20px_rgba(225,29,46,0.25)] shrink-0 flex items-center justify-center">
                      <Image
                        src={server.iconUrl || '/visuals/staff.png'}
                        alt={server.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    {/* Server Title, Slug & ID */}
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-lg md:text-xl font-extrabold text-white truncate tracking-tight group-hover:text-red-300 transition-colors">
                        {server.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                          /{server.slug}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono truncate flex items-center gap-1">
                          <Bot size={13} className="text-red-400 shrink-0" />
                          ID: <span className="text-zinc-300">{server.id}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Boost Indicator */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-[11px] font-semibold shadow-[0_0_10px_rgba(225,29,46,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                      <span>Bot Active</span>
                    </div>
                    {server.boostLevel > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono flex items-center gap-1">
                        <Flame size={11} className="text-red-400" />
                        Level {server.boostLevel} ({server.boostCount} Boosts)
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Stats Tiles */}
                <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <Activity size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-medium">Online</span>
                      <span className="text-base font-bold text-white font-mono">
                        {server.onlineCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <Users size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-medium">Total Members</span>
                      <span className="text-base font-bold text-white font-mono">
                        {server.totalCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manage Server Action Button with Red Hover Glow */}
              <button
                type="button"
                onClick={() => handleManageServer(server)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] text-white font-bold text-sm shadow-[0_0_20px_rgba(225,29,46,0.35)] hover:shadow-[0_0_35px_rgba(225,29,46,0.7)] border border-red-400/30 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
              >
                <span>Manage Server</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
