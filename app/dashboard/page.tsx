"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  Server,
  KeyRound,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { api, UserProfileData } from '@/lib/api';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [whitelistedCount, setWhitelistedCount] = useState<number | null>(null);

  useEffect(() => {
    const loadOverviewData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const userRes = await api.fetchCurrentUser(token);
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
        }

        const isPrivileged =
          userRes.data?.role === 'ROLE_HIGH_COMMAND' ||
          userRes.data?.roles?.includes('High Command') ||
          userRes.data?.roles?.includes('Minister') ||
          userRes.data?.role === 'ROLE_MINISTER';

        if (isPrivileged) {
          try {
            const listRes = await api.fetchWhitelistedUsers(token);
            if (listRes.success && listRes.data) {
              setWhitelistedCount(listRes.data.length);
            }
          } catch {
            // Not permitted or failed
          }
        }
      } catch {
        // Ignored
      }
    };

    loadOverviewData();
  }, []);

  const stats = [
    {
      title: 'Active Identity',
      value: user ? user.email.split('@')[0] : 'Operator',
      sub: user?.role || 'ROLE_USER',
      icon: Users,
      glow: 'from-red-500/20 to-transparent',
    },
    {
      title: 'Whitelisted Personnel',
      value: whitelistedCount !== null ? `${whitelistedCount} Active` : 'Restricted',
      sub: 'Enforced via PostgreSQL DB',
      icon: ShieldCheck,
      glow: 'from-emerald-500/20 to-transparent',
    },
    {
      title: 'Discord 2FA Guard',
      value: user?.discordLinked ? 'Linked & Verified' : 'Pending',
      sub: user?.discordUsername ? `@${user.discordUsername}` : 'Single-Use Token upgraded',
      icon: Lock,
      glow: 'from-indigo-500/20 to-transparent',
    },
    {
      title: 'Security Clearance',
      value: user?.designations || 'Personnel',
      sub: user?.roles || 'Standard Operator',
      icon: KeyRound,
      glow: 'from-amber-500/20 to-transparent',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141414] via-[#101010] to-[#0a0a0a] border border-white/10 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-medium w-fit">
              <Sparkles size={13} />
              <span>RNG CONTROL CENTER v2.0</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
              Welcome back, {user?.fullName || user?.email?.split('@')[0] || 'Operator'}
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed">
              Real-time monitoring and authorization hub. Your session is protected with dual-token JWTs,
              Discord OAuth2 2FA, and strict role hierarchy enforcement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(user?.role === 'ROLE_HIGH_COMMAND' || user?.role === 'ROLE_MINISTER' || user?.roles?.includes('Minister') || user?.roles?.includes('High Command')) && (
              <Link
                href="/dashboard/whitelist"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,46,0.35)] transition-all"
              >
                <ShieldCheck size={16} />
                <span>Manage Whitelist</span>
                <ChevronRight size={14} />
              </Link>
            )}
            <Link
              href="/dashboard/account"
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <span>Account Details</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl bg-[#111111]/70 border border-white/5 p-5 backdrop-blur-xl hover:border-white/15 transition-all group"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${stat.glow} blur-2xl pointer-events-none`} />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-colors">
                  <Icon size={18} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white tracking-tight truncate">
                  {stat.value}
                </span>
                <span className="text-[11px] text-zinc-500 truncate font-mono">
                  {stat.sub}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action & Info Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Whitelist System Card */}
        <div className="lg:col-span-2 rounded-3xl bg-[#111111]/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Personnel Whitelist & RBAC</h3>
                  <p className="text-xs text-zinc-400">Hierarchical governance matrix</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                PostgreSQL Active
              </span>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed mt-2">
              The Whitelist engine restricts access exclusively to verified members. New email-whitelisted
              accounts have passwords automatically registered in BCrypt on first login and mandate Discord
              OAuth2 2FA linking before any sensitive actions can be performed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-mono">Supreme Clearance</span>
                <span className="text-sm font-semibold text-white">High Command</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-mono">Ministries</span>
                <span className="text-sm font-semibold text-white">6 Specialized Departments</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-mono">Chancellory</span>
                <span className="text-sm font-semibold text-white">Roughnuts, RNG, Rivals</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">
              Strict scoping: Ministers may only manage their respective domain.
            </span>
            <Link
              href="/dashboard/whitelist"
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <span>Open Whitelist</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Server & Node Status Card */}
        <div className="rounded-3xl bg-[#111111]/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Game Server Telemetry</h3>
                <p className="text-xs text-zinc-400">Cluster connectivity</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Main Instance</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">2FA Verification Gate</span>
                <span className="text-zinc-300 font-mono">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">PostgreSQL Schema</span>
                <span className="text-zinc-300 font-mono">v4 MIGRATED</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-[11px] text-zinc-500 font-mono block">
              Node ID: rng-cluster-us-east · Java 21 Spring Boot
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
