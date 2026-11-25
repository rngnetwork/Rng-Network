'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Server,
  User,
  Users,
  Boxes,
  Bot,
  LogOut,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import { useEffectivePermissions } from './EffectivePermissionsContext';
import { fetchUserManagedServers } from '@/lib/api/dashboard/servers';
import { logout } from '@/lib/api/auth/session';
import { getDiscordAvatarUrl } from '@/lib/api/auth/discord';
import type { UserProfileData } from '@/lib/model/user';
import { Avatar } from '@/components/common/feedback/Avatar';
import { HamburgerMenu } from '@/components/common/navigation/HamburgerMenu';

export interface DashboardSidebarNavProps {
  user: UserProfileData | null;
  isCollapsed?: boolean;
}

export const DashboardSidebarNav: React.FC<DashboardSidebarNavProps> = ({
  user,
  isCollapsed = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [serverCount, setServerCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCount = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetchUserManagedServers(token);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setServerCount(res.data.length);
        }
      } catch {
        // Handled silently on background polling
      }
    };

    void loadCount();
    const interval = setInterval(() => void loadCount(), 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHighCommand =
    user?.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
    user?.role === 'ROLE_HIGH_COMMAND' ||
    user?.roles?.includes('High Command') ||
    user?.designations?.includes('Supreme');
  const isMinister =
    user?.role === 'ROLE_MINISTER' ||
    user?.roles?.includes('Minister') ||
    user?.designations?.includes('Ministry');
  const canAccessWhitelist = Boolean(isHighCommand || isMinister);

  const {
    hasPermission,
    isPreviewMode,
    previewRoleName,
    exitPreviewMode,
  } = useEffectivePermissions();

  const canAccessPersonnelRoles = hasPermission(
    'dashboard',
    'dashboard.personnel',
    'dashboard.personnel.roles'
  );
  const canAccessPersonnelPerms = hasPermission(
    'dashboard',
    'dashboard.personnel',
    'dashboard.personnel.perms'
  );

  const navItems = [
    {
      label: 'Servers',
      href: '/dashboard/servers',
      icon: Server,
      show: hasPermission('dashboard', 'dashboard.servers'),
      badge: serverCount !== null ? `${serverCount} Live` : 'Live',
    },
    {
      label: 'Embed Builder',
      href: '/dashboard/embeds',
      icon: Boxes,
      show: hasPermission('dashboard', 'dashboard.embeds'),
      badge: 'V2',
    },
    {
      label: 'Bot Modules',
      href: '/dashboard/botconfig',
      icon: Bot,
      show: hasPermission('dashboard', 'dashboard.botconfig'),
    },
    {
      label: 'Whitelist',
      href: '/dashboard/whitelist',
      icon: ShieldCheck,
      show: hasPermission('dashboard', 'dashboard.whitelist'),
      badge: hasPermission('dashboard', 'dashboard.whitelist') && isHighCommand ? 'Admin' : 'Scoped',
    },
    {
      label: 'Personnel',
      href: '/dashboard/personnel',
      icon: Users,
      show:
        hasPermission('dashboard', 'dashboard.personnel') &&
        (canAccessPersonnelRoles || canAccessPersonnelPerms),
    },
    {
      label: 'Account',
      href: '/dashboard/account',
      icon: User,
      show: hasPermission('dashboard', 'dashboard.account'),
    },
  ];

  const handleLogout = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    await logout();
    router.push('/auth/login');
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface-canvas/95 backdrop-blur-xl border-b border-white/[0.08] px-4 flex items-center justify-between z-40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="relative w-8 h-8 rounded-lg bg-brand-red/20 p-1 border border-brand-red/30">
            <Image
              src="/assets/LOGO_FOR_STAFFS.png"
              alt="RNG Network"
              fill
              className="object-contain p-0.5"
              unoptimized
            />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-white font-mono">
            RNG CONTROL
          </span>
        </Link>

        <HamburgerMenu
          isOpen={mobileOpen}
          onToggle={() => setMobileOpen((prev) => !prev)}
        />
      </div>

      <aside
        aria-label="Primary Sidebar Navigation"
        className={`hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-surface-canvas/90 backdrop-blur-2xl border-r border-white/[0.08] z-40 transition-transform duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-5">
          <div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 pb-6 border-b border-white/[0.08] transition-opacity hover:opacity-90 cursor-pointer"
            >
              <div className="relative w-10 h-10 rounded-apple-md bg-gradient-to-br from-brand-red/20 to-black p-1.5 border border-brand-red/30 shadow-crimson-glow group-hover:border-brand-red/60 group-hover:scale-105 transition-all duration-200">
                <Image
                  src="/assets/LOGO_FOR_STAFFS.png"
                  alt="RNG Network"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-widest uppercase text-white font-mono flex items-center gap-1.5 group-hover:text-brand-red transition-colors">
                  RNG NETWORK
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">Control Center</span>
              </div>
            </Link>

            <nav className="mt-6 flex flex-col gap-1.5" aria-label="Main Sections">
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Navigation
              </div>
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center justify-between pl-4 pr-3.5 py-2.5 rounded-apple-md text-sm font-medium transition-all duration-200 min-h-[44px] ${
                        isActive
                          ? 'bg-brand-red/10 text-white border border-brand-red/30 shadow-crimson-glow'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={`transition-colors duration-200 ${
                            isActive ? 'text-brand-red' : 'text-zinc-400 group-hover:text-zinc-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-brand-red/20 text-red-300 border border-brand-red/40'
                                : 'bg-white/5 text-zinc-400 border border-white/10'
                            }`}
                          >
                            {item.label === 'Servers' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            )}
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            isActive
                              ? 'text-brand-red translate-x-0.5'
                              : 'text-zinc-600 group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute left-1.5 top-2.5 bottom-2.5 w-1 bg-brand-red rounded-full"
                        />
                      )}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2">
            {isPreviewMode && (
              <button
                type="button"
                onClick={() => {
                  void exitPreviewMode();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-apple-md text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all cursor-pointer"
              >
                <EyeOff size={14} />
                <span className="truncate">
                  Exit Preview ({previewRoleName || 'Active'})
                </span>
              </button>
            )}
            {user && (
              <div className="px-3 py-2.5 rounded-apple-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={getDiscordAvatarUrl(user.discordId, user.discordAvatar)}
                    alt={user.fullName || user.email}
                    fallback={user.fullName || user.email.split('@')[0]}
                    size="md"
                    status="online"
                    className="shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-brand-red font-mono truncate">
                      {user.designations || user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-apple-md text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 min-h-[44px]"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

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
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-surface-canvas border-r border-white/10 z-50 shadow-apple-modal pt-16"
            >
              <div className="flex flex-col h-full justify-between p-5">
                <nav className="flex flex-col gap-1.5">
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
                          className={`flex items-center justify-between px-4 py-3 rounded-apple-md text-sm font-medium min-h-[44px] ${
                            isActive
                              ? 'bg-brand-red/15 text-white border border-brand-red/30'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} className={isActive ? 'text-brand-red' : 'text-zinc-400'} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-mono">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                </nav>
                {isPreviewMode && (
                  <button
                    type="button"
                    onClick={() => {
                      void exitPreviewMode();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 rounded-apple-md text-xs font-semibold text-amber-200 bg-amber-500/15 border border-amber-500/30 min-h-[44px] cursor-pointer"
                  >
                    <EyeOff size={15} />
                    <span className="truncate">
                      Exit Preview ({previewRoleName || 'Active'})
                    </span>
                  </button>
                )}
                {user && (
                  <div className="px-3.5 py-3 mb-3 rounded-apple-md bg-white/[0.03] border border-white/5 flex items-center gap-3">
                    <Avatar
                      src={getDiscordAvatarUrl(user.discordId, user.discordAvatar)}
                      alt={user.fullName || user.email}
                      fallback={user.fullName || user.email.split('@')[0]}
                      size="md"
                      status="online"
                      className="shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {user.fullName || user.email.split('@')[0]}
                      </span>
                      <span className="text-[10px] text-brand-red font-mono truncate">
                        {user.designations || user.role}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-apple-md text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 min-h-[44px]"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
