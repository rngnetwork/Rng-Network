"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Bot,
  FileCode,
  LineChart,
  AlertCircle,
  Activity,
  Users
} from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';

type DetailTab = 'general' | 'modules' | 'embeds' | 'analytics';

export default function ServerDetailPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [loading, setLoading] = useState(true);

  // Form states for General Settings
  const [serverName, setServerName] = useState('');
  const [prefix, setPrefix] = useState('!');
  const [locale, setLocale] = useState('English (US)');
  const [welcomeChannel, setWelcomeChannel] = useState('#welcome');

  // Bot modules state matching the 15 RNG modules from the architecture document
  const [modules, setModules] = useState([
    { name: 'Moderation & AutoMod', enabled: true, category: 'Security' },
    { name: 'Application System', enabled: true, category: 'Administration' },
    { name: 'Verification & Gatekeeper', enabled: true, category: 'Security' },
    { name: 'Anti-Nuke & Raid Shield', enabled: true, category: 'Security' },
    { name: 'Audit & Action Logging', enabled: true, category: 'Core' },
    { name: 'Ticket Support Center', enabled: true, category: 'Community' },
    { name: 'Economy System', enabled: false, category: 'Engagement' },
    { name: 'Finance & Treasury', enabled: true, category: 'Administration' },
    { name: 'Giveaways & Drops', enabled: false, category: 'Engagement' },
    { name: 'Events & Tournaments', enabled: true, category: 'Engagement' },
    { name: 'Welcome & Onboarding', enabled: true, category: 'Core' },
    { name: 'Staff Management', enabled: true, category: 'Administration' },
    { name: 'Tasks & Delegations', enabled: false, category: 'Administration' },
    { name: 'Custom Dynamic Commands', enabled: false, category: 'Core' },
    { name: 'Voice Hub Channels', enabled: true, category: 'Community' }
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadServer = async () => {
      try {
        const found = await mockServersApi.getServerById(serverId);
        if (isMounted) {
          if (found) {
            setServer(found);
            setServerName(found.name);
            if (found.prefix) setPrefix(found.prefix);
            if (found.locale) setLocale(found.locale);
            if (found.welcomeChannel) setWelcomeChannel(found.welcomeChannel);
          }
        }
      } catch (err) {
        console.error('Failed to load server details:', err);
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

  const toggleModule = (index: number) => {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], enabled: !next[index].enabled };
      return next;
    });
  };

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
          The requested Discord guild could not be found or has not been authorized.
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

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General Discord Settings', icon: Settings },
    { id: 'modules', label: 'Bot Module Configuration', icon: Bot },
    { id: 'embeds', label: 'Embed Builder', icon: FileCode },
    { id: 'analytics', label: 'Analytics & Audit', icon: LineChart },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Back Link */}
      <div>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Server Management</span>
        </Link>
      </div>

      {/* Main Server Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-tl from-[#2A050A]/90 via-[#101010] to-[#0A0A0A] border border-red-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_25px_rgba(225,29,46,0.25)] shrink-0">
              <Image
                src={server.icon}
                alt={server.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold text-white truncate">
                  {server.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Bot Linked
                </span>
              </div>

              <span className="text-xs text-zinc-400 font-mono mt-1">
                Snowflake ID: {server.id}
              </span>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl truncate">
                {server.description}
              </p>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <Activity size={18} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Online</span>
                <span className="text-sm font-bold text-emerald-300 font-mono">{server.onlineCount}</span>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <Users size={18} className="text-red-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Members</span>
                <span className="text-sm font-bold text-white font-mono">{server.totalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Horizontal Server Navigation Bar (Server-Wide Tabs) */}
      <div className="relative border-b border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-red-400' : 'text-zinc-500'} />
              <span>{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="serverTabIndicator"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_10px_#ef4444]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Panel Content with Slide Transitions */}
      <AnimatePresence mode="wait">
        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <motion.div
            key="general"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="p-6 md:p-8 rounded-3xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-white">General Server Settings</h3>
                <p className="text-xs text-zinc-400">Core Discord guild parameters and bot communication routing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Server Display Name</label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Command Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-sm font-mono focus:outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Locale & Timezone</label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="English (US)">English (US) - UTC-5</option>
                    <option value="English (UK)">English (UK) - UTC+0</option>
                    <option value="Español">Español - UTC-3</option>
                    <option value="Français">Français - UTC+1</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-300">Welcome & Arrival Channel</label>
                  <select
                    value={welcomeChannel}
                    onChange={(e) => setWelcomeChannel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="#welcome">#welcome</option>
                    <option value="#announcements">#announcements</option>
                    <option value="#lounge">#lounge</option>
                    <option value="#general">#general</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(225,29,46,0.35)] transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Bot Modules */}
        {activeTab === 'modules' && (
          <motion.div
            key="modules"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="p-6 md:p-8 rounded-3xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Bot Module Configuration</h3>
                  <p className="text-xs text-zinc-400">
                    Enable or disable specific bot engines for this Discord server.
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono">
                  {modules.filter((m) => m.enabled).length}/{modules.length} Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {modules.map((mod, idx) => (
                  <div
                    key={mod.name}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                      mod.enabled
                        ? 'bg-red-500/[0.04] border-red-500/30'
                        : 'bg-white/[0.02] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          mod.enabled ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-zinc-600'
                        }`}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate">{mod.name}</span>
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
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Embed Builder */}
        {activeTab === 'embeds' && (
          <motion.div
            key="embeds"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="p-8 rounded-3xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl text-center max-w-xl mx-auto flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_20px_rgba(225,29,46,0.2)]">
                <FileCode size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Server Embed Dispatcher</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Build rich Discord embeds with color hex pickers, author banners, interactive buttons, and dropdown menus for <span className="text-white font-semibold">{server.name}</span>.
              </p>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
              >
                Launch Builder Workspace
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Analytics & Audit */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {/* Stat tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-mono uppercase">Server Uptime</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">99.98%</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-mono uppercase">Cluster Health</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">Healthy</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-mono uppercase">Bot Latency</span>
                <span className="text-xl font-bold text-white font-mono">18ms</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400 font-mono uppercase">Bot Shard</span>
                <span className="text-xl font-bold text-red-400 font-mono">Shard #01</span>
              </div>
            </div>

            {/* Audit log table with diff chips */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#111111]/70 border border-white/10 backdrop-blur-xl flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Localized Audit Trail</h3>
                <p className="text-xs text-zinc-400">Historical configuration changes dispatched to this guild.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="text-[10px] uppercase font-mono text-zinc-500 bg-white/[0.02] border-b border-white/5">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Officer</th>
                      <th className="py-3 px-4">Key / Parameter</th>
                      <th className="py-3 px-4">State Transition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr>
                      <td className="py-3.5 px-4 text-zinc-400">26/08/26 12:40</td>
                      <td className="py-3.5 px-4 text-white font-semibold">Chief High Command</td>
                      <td className="py-3.5 px-4 text-red-300">automod.spam_threshold</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/20 line-through mr-1.5">5</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">8</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 text-zinc-400">25/08/26 19:15</td>
                      <td className="py-3.5 px-4 text-white font-semibold">Tech Specialist</td>
                      <td className="py-3.5 px-4 text-red-300">tickets.log_channel</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/20 line-through mr-1.5">#mod-log</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">#tickets-log</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 text-zinc-400">24/08/26 08:30</td>
                      <td className="py-3.5 px-4 text-white font-semibold">Minister of Tech</td>
                      <td className="py-3.5 px-4 text-red-300">anti_nuke.guard</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">enabled</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
