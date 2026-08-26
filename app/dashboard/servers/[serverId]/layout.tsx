"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Bot,
  FileCode,
  LineChart,
  Flame,
  AlertCircle,
  Hash
} from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadServer = async () => {
      try {
        const found = await mockServersApi.getServerById(serverId);
        if (isMounted) {
          setServer(found);
        }
      } catch (err) {
        console.error('Failed to load server:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServer();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-8 rounded-3xl bg-[#111111]/70 border border-white/10 text-center max-w-lg mx-auto">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Server Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">
          The requested Discord guild could not be found.
        </p>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(225,29,46,0.3)]"
        >
          <ArrowLeft size={16} />
          Return to Servers
        </Link>
      </div>
    );
  }

  const tabs = [
    {
      id: 'settings',
      label: 'Server Settings',
      href: `/dashboard/servers/${serverId}/settings`,
      icon: Settings,
    },
    {
      id: 'botconfig',
      label: 'Bot Modules',
      href: `/dashboard/servers/${serverId}/botconfig`,
      icon: Bot,
    },
    {
      id: 'embeds',
      label: 'Embeds',
      href: `/dashboard/servers/${serverId}/embeds`,
      icon: FileCode,
    },
    {
      id: 'analytics',
      label: 'Analytics & Audit',
      href: `/dashboard/servers/${serverId}/analytics`,
      icon: LineChart,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Back Link to Servers */}
      <div>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Server Management</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* BOX 1: Server Stats Big Card (Logo on left, Title, Red dot online, Total) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-tl from-[#2A050A]/90 via-[#101010] to-[#0A0A0A] border border-red-500/20 p-6 md:p-8 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,46,0.15)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 md:gap-7 min-w-0">
            {/* Enlarged Logo with rounded square shape on the left */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-red-500/40 bg-black/60 shadow-[0_0_30px_rgba(225,29,46,0.35)] shrink-0 flex items-center justify-center">
              <Image
                src={server.icon}
                alt={server.name}
                fill
                unoptimized
                className="object-cover"
              />
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

                <div className="text-zinc-400 font-mono text-xs hidden sm:flex items-center gap-1">
                  <Hash size={12} className="text-red-400" />
                  <span>Guild ID: {server.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* BOX 2: Navigation Bar with Red-Glowing Horizontal Scrollbar & Child Page  */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl bg-[#0e0e0e]/90 border border-red-500/20 p-6 md:p-8 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,46,0.12)] flex flex-col gap-6"
      >
        {/* Custom Red-Glowing Scrollbar Definition */}
        <style dangerouslySetInnerHTML={{__html: `
          .red-scroll::-webkit-scrollbar {
            height: 4px;
          }
          .red-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 999px;
          }
          .red-scroll::-webkit-scrollbar-thumb {
            background: #E11D2E;
            border-radius: 999px;
            box-shadow: 0 0 10px rgba(225, 29, 46, 0.8);
          }
          .red-scroll::-webkit-scrollbar-thumb:hover {
            background: #FF3B4D;
            box-shadow: 0 0 14px rgba(255, 59, 77, 1);
          }
        `}} />

        {/* Horizontal Navigation Tabs with Red-Glowing Scrollbar */}
        <div className="relative border-b border-white/10 flex items-center gap-2 overflow-x-auto pb-2.5 red-scroll">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Match active route: either exact or pathname starts with tab.href
            const isActive = pathname === tab.href || (tab.id === 'settings' && pathname === `/dashboard/servers/${serverId}`);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-red-400' : 'text-zinc-500'} />
                <span>{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="serverActiveTabIndicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Dynamic Nested Child Route Content */}
        <div className="w-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
