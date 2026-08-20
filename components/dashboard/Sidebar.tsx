"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Radio,
  ChevronRight
} from 'lucide-react';
import { api, UserProfileData } from '@/lib/api';

interface SidebarProps {
  user: UserProfileData | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHighCommand = user?.role === 'ROLE_HIGH_COMMAND' || user?.roles?.includes('High Command') || user?.designations?.includes('Supreme');
  const isMinister = user?.role === 'ROLE_MINISTER' || user?.roles?.includes('Minister') || user?.designations?.includes('Ministry');
  const canAccessWhitelist = isHighCommand || isMinister;

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
      badge: 'Live',
    },
    {
      label: 'Whitelist',
      href: '/dashboard/whitelist',
      icon: ShieldCheck,
      show: canAccessWhitelist,
      badge: isHighCommand ? 'Admin' : 'Scoped',
    },
    {
      label: 'Account',
      href: '/dashboard/account',
      icon: User,
      show: true,
    },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    await api.logout();
    router.push('/');
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-5">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/20 to-black p-1.5 border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.3)]">
            <Image
              src="/visuals/LOGO_FOR_STAFFS.png"
              alt="RNG Network"
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
              RNG NETWORK
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Control Center</span>
          </div>
        </div>

        {/* Live System Status Pill */}
        <div className="mt-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium">Network 2FA</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            SECURED
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 flex flex-col gap-1.5">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
            Navigation
          </div>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/10 text-white border border-red-500/30 shadow-[0_0_15px_rgba(225,29,46,0.15)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                          isActive
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-white/5 text-zinc-400 border border-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${
                        isActive ? 'text-red-400 translate-x-0.5' : 'text-zinc-600 group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full shadow-[0_0_8px_#ef4444]"
                    />
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user.fullName || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-red-400 font-mono truncate">
                  {user.designations || user.role}
                </span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0c0c0c]/90 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-red-600/20 p-1 border border-red-500/30">
            <Image
              src="/visuals/LOGO_FOR_STAFFS.png"
              alt="RNG Network"
              fill
              className="object-contain p-0.5"
              unoptimized
            />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-white font-mono">
            RNG CONTROL
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-[#0c0c0c]/80 backdrop-blur-2xl border-r border-white/10 z-40">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#0c0c0c] border-r border-white/10 z-50 shadow-2xl pt-4"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
