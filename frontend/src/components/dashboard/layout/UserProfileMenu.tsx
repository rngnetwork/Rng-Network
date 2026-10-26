'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { fetchCurrentUser, logout, refreshToken } from '@/lib/api/auth/session';
import { getDiscordAvatarUrl } from '@/lib/api/auth/discord';
import type { UserProfileData } from '@/lib/model/user';
import { Badge } from '@/components/common/feedback/Badge';
import { Avatar } from '@/components/common/feedback/Avatar';

export interface UserProfileMenuProps {
  initialUser?: UserProfileData | null;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ initialUser = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfileData | null>(initialUser);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialUser) {
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      let accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        try {
          const refreshRes = await refreshToken();
          if (refreshRes.success && refreshRes.data?.accessToken) {
            accessToken = refreshRes.data.accessToken;
            localStorage.setItem('accessToken', accessToken);
          }
        } catch {
          accessToken = null;
        }
      }

      if (!accessToken) {
        return;
      }

      try {
        const res = await fetchCurrentUser(accessToken);
        if (isMounted && res.success && res.data) {
          setUser(res.data);
        }
      } catch {
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    await logout();
    router.push('/auth/login');
    router.refresh();
  };

  const activeProfile = initialUser ?? user;
  if (!activeProfile) {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />;
  }

  const avatarSrc = getDiscordAvatarUrl(activeProfile.discordId, activeProfile.discordAvatar);
  const fallbackName = activeProfile.fullName || activeProfile.email.split('@')[0];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open user profile menu"
        aria-expanded={isOpen}
        className="relative flex items-center justify-center rounded-full transition-all duration-200 hover:ring-2 hover:ring-brand-red/80 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-red shadow-sm cursor-pointer"
      >
        <Avatar
          src={avatarSrc}
          alt={fallbackName}
          fallback={fallbackName}
          size="lg"
          status={activeProfile.status === 'OFFLINE' ? 'offline' : 'online'}
          className="ring-1 ring-white/10 rounded-full"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-72 bg-zinc-900/95 border border-white/10 rounded-apple-xl shadow-apple-modal overflow-hidden backdrop-blur-2xl"
          >
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Avatar
                  src={avatarSrc}
                  alt={fallbackName}
                  fallback={fallbackName}
                  size="lg"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">
                    {fallbackName}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono truncate">
                    {activeProfile.email}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Provider</span>
                  <Badge variant="neutral">{activeProfile.provider || 'EMAIL'}</Badge>
                </div>
                {activeProfile.discordLinked && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Discord</span>
                    <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      @{activeProfile.discordUsername || activeProfile.discordId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Clearance</span>
                  <Badge variant="crimson">{activeProfile.role}</Badge>
                </div>
              </div>
            </div>

            <div className="p-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/account');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-apple-md transition-colors font-medium"
              >
                <User size={15} className="text-brand-red" />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-apple-md transition-colors font-medium"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
