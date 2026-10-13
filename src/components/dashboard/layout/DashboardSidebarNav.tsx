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
  Boxes,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { fetchUserManagedServers } from '@/lib/api/dashboard/servers';
import { logout } from '@/lib/api/auth/session';
import type { UserProfileData } from '@/lib/model/user';
import { HamburgerMenu } from '@/components/common/navigation/HamburgerMenu';
import { Sidebar } from '@/components/common/navigation/Sidebar';
import { Avatar } from '@/components/common/feedback/Avatar';
import { Tooltip } from '@/components/common/feedback/Tooltip';

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

  const navItems = [
    {
      label: 'Servers',
      href: '/dashboard/servers',
      icon: Server,
      show: true,
      badge: serverCount !== null ? `${serverCount} Live` : 'Live',
    },
    {
      label: 'Embed Builder',
      href: '/dashboard/embeds',
      icon: Boxes,
      show: true,
      badge: 'V2',
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
    await logout();
    router.push('/auth/login');
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface-canvas/95 backdrop-blur-xl border-b border-white/[0.08] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
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
        </div>

        <HamburgerMenu
          isOpen={mobileOpen}
          onToggle={() => setMobileOpen((prev) => !prev)}
        />
      </div>

      <div className="hidden md:block fixed top-0 left-0 z-40 h-screen">
        <Sidebar
          items={navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return {
                id: item.href,
                label: item.label,
                href: item.href,
                icon: <Icon size={18} />,
                badge: item.badge,
                active:
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`)),
              };
            })}
          collapsed={isCollapsed}
          header={
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-apple-md bg-gradient-to-br from-brand-red/20 to-black p-1.5 border border-brand-red/30 shadow-crimson-glow">
                <Image
                  src="/assets/LOGO_FOR_STAFFS.png"
                  alt="RNG Network"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                    RNG NETWORK
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">Control Center</span>
                </div>
              )}
            </div>
          }
          footer={
            <div className="flex flex-col gap-2">
              {user && (
                <div className="px-3 py-2 rounded-apple-md bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      fallback={user.fullName || user.email}
                      size="sm"
                      status="online"
                    />
                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate">
                          {user.fullName || user.email.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-brand-red font-mono truncate">
                          {user.designations || user.role}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-apple-md text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 min-h-[44px]"
              >
                <LogOut size={15} />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          }
          className="h-full bg-surface-canvas/90 backdrop-blur-2xl border-r border-white/[0.08]"
        />
      </div>

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
