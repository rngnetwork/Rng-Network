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
  Bot
} from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadServers = async () => {
      try {
        const data = await mockServersApi.getConnectedServers();
        if (isMounted) {
          setServers(data);
        }
      } catch (err) {
        console.error('Failed to load servers:', err);
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
  }, []);

  const handleManageServer = (serverId: string) => {
    router.push(`/dashboard/servers/${serverId}/settings`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
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

      {/* Servers List (Equal-height cards with smooth fade animation) */}
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
                        src={server.icon}
                        alt={server.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    {/* Server Title & ID */}
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-lg md:text-xl font-extrabold text-white truncate tracking-tight group-hover:text-red-300 transition-colors">
                        {server.name}
                      </h2>
                      <span className="text-xs text-zinc-400 font-mono mt-0.5 truncate flex items-center gap-1.5">
                        <Bot size={13} className="text-red-400 shrink-0" />
                        Guild ID: <span className="text-zinc-300">{server.id}</span>
                      </span>
                    </div>
                  </div>

                  {/* Red Theme Status Indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-mono text-[11px] font-semibold shrink-0 shadow-[0_0_10px_rgba(225,29,46,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                    <span>Bot Active</span>
                  </div>
                </div>

                {/* Server Description (Uniform 2-line height across all cards) */}
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-6 h-10 line-clamp-2">
                  {server.description}
                </p>

                {/* Member Stats Tiles */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <Activity size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400 font-medium">Online</span>
                      <span className="text-base font-bold text-white font-mono">
                        {server.onlineCount}
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
                        {server.totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manage Server Action Button with Red Hover Glow */}
              <button
                type="button"
                onClick={() => handleManageServer(server.id)}
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
