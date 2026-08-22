"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Layers
} from 'lucide-react';
import { api, UserProfileData, PersonnelHierarchyMap, getDiscordAvatarUrl } from '@/lib/api';

export default function AccountPage() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [hierarchy, setHierarchy] = useState<PersonnelHierarchyMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [profileRes, hierRes] = await Promise.allSettled([
          api.fetchCurrentUser(token),
          api.fetchPersonnelHierarchy(token),
        ]);

        if (isMounted) {
          if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.data) {
            setUser(profileRes.value.data);
          }
          if (hierRes.status === 'fulfilled' && hierRes.value.success && hierRes.value.data) {
            setHierarchy(hierRes.value.data);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-[#111111]/70 border border-white/10 text-center">
        <p className="text-zinc-400">Could not retrieve account details. Please sign in again.</p>
      </div>
    );
  }

  const avatarUrl = getDiscordAvatarUrl(user.discordId, user.discordAvatar);
  const isHighCommand =
    user.role === 'ROLE_HIGH_COMMAND' ||
    user.roles?.includes('High Command') ||
    user.designations?.includes('Supreme');
  const isMinister =
    user.role === 'ROLE_MINISTER' ||
    user.roles?.includes('Minister') ||
    user.designations?.includes('Ministry');

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Session Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/whitelist"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Return to Whitelist"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Account Profile</h1>
            <p className="text-xs md:text-sm text-zinc-400">Manage identity, permissions, and 2FA credentials</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active Session
          </span>
        </div>
      </div>

      {/* Main Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141414] via-[#101010] to-[#0d0d0d] border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_25px_rgba(225,29,46,0.25)] shrink-0">
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {user.fullName || user.email.split('@')[0]}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold tracking-wider uppercase border ${
                    isHighCommand
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(225,29,46,0.3)]'
                      : isMinister
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-300 border-white/10'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <span className="text-sm text-zinc-400 font-mono">{user.email}</span>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono flex items-center gap-1">
                  <KeyRound size={12} className="text-red-400" />
                  Provider: {user.provider || 'EMAIL'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Status: {user.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2-Column Grid: Personnel Assignments & Discord 2FA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personnel Hierarchy Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-[#111111]/70 border border-white/10 p-6 backdrop-blur-xl flex flex-col justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Personnel Hierarchy</h3>
                <p className="text-xs text-zinc-400">Assigned Designations & Roles</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Department Roles & Assignments
              </span>
              <div className="flex flex-col gap-2">
                {user.designationList && user.designationList.length > 0 ? (
                  user.designationList.map((des) => {
                    const roles = user.roleList
                      ? user.roleList
                          .filter((r) => r.startsWith(`${des}:`) || (!r.includes(':') && (hierarchy[des] || []).includes(r)))
                          .map((r) => (r.startsWith(`${des}:`) ? r.replace(`${des}:`, '') : r))
                      : [];
                    return (
                      <div
                        key={des}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <span className="text-xs text-red-300 font-semibold flex items-center gap-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {des}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {roles.length > 0 ? (
                            roles.map((r) => (
                              <span
                                key={r}
                                className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/5 text-zinc-200 border border-white/10 font-medium"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">Standard</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-zinc-500 italic">
                    {user.designations || 'Standard Personnel'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Security Clearances Enforced</span>
            <Shield size={14} className="text-red-400" />
          </div>
        </motion.div>

        {/* Discord 2FA Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-[#111111]/70 border border-white/10 p-6 backdrop-blur-xl flex flex-col justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Discord 2FA Integration</h3>
                <p className="text-xs text-zinc-400">Mandatory hardware / OAuth2 guard</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-400">2FA Status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  LINKED & VERIFIED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-400">Discord User</span>
                <span className="text-indigo-300 font-mono">
                  {user.discordUsername ? `@${user.discordUsername}` : 'Authenticated'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-zinc-400">Discord Snowflake ID</span>
                <span className="text-zinc-300 font-mono">{user.discordId || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500 font-mono">
            <span>Single-use Pre-2FA tokens revoked on 2FA upgrade.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
