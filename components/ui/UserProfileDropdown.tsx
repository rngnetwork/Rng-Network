"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api, getDiscordAvatarUrl } from '@/lib/api';

interface UserData {
  email: string;
  fullName: string;
  provider: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  discordLinked: boolean;
  role: string;
  avatar: string;
}

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    await api.logout();
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    const fetchUser = async () => {
      let accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        try {
          const refreshRes = await api.refreshToken();
          if (refreshRes.success && refreshRes.data?.accessToken) {
            accessToken = refreshRes.data.accessToken;
            localStorage.setItem('accessToken', accessToken);
          }
        } catch {
          // Token refresh unavailable
        }
      }

      if (!accessToken) {
        setUser({
          email: 'guest@rng.com',
          fullName: 'Guest Staff',
          provider: 'EMAIL',
          discordId: 'STAFF-001',
          discordUsername: 'guest_staff',
          discordLinked: false,
          role: 'ROLE_USER',
          avatar: '/visuals/staff.png',
        });
        return;
      }

      try {
        const res = await api.fetchCurrentUser(accessToken);
        if (res.success && res.data) {
          const avatarUrl = getDiscordAvatarUrl(res.data.discordId, res.data.discordAvatar);
          setUser({
            email: res.data.email || 'testuser@rng.com',
            fullName: res.data.fullName || 'RNG Staff Member',
            provider: res.data.provider || 'EMAIL',
            discordId: res.data.discordId || 'UNLINKED',
            discordUsername: res.data.discordUsername || 'discord_user#0',
            discordAvatar: res.data.discordAvatar,
            discordLinked: res.data.discordLinked ?? true,
            role: res.data.role || 'ROLE_USER',
            avatar: avatarUrl,
          });
        }
      } catch {
        setUser({
          email: 'testuser@rng.com',
          fullName: 'Test User',
          provider: 'EMAIL',
          discordId: 'UNLINKED',
          discordUsername: 'discord_user#0',
          discordLinked: true,
          role: 'ROLE_USER',
          avatar: '/visuals/staff.png',
        });
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />;
  }

  const handleImageError = () => {
    setUser(prev => prev ? { ...prev, avatar: '/visuals/staff.png' } : null);
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:border-[#E11D2E]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/50"
      >
        <Image src={user.avatar} alt="Profile" fill unoptimized className="object-cover" onError={handleImageError} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                  <Image src={user.avatar} alt="Profile" fill unoptimized className="object-cover" onError={handleImageError} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">{user.fullName}</span>
                  <span className="text-[#A0A0A0] text-[11px] font-medium truncate">{user.email}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Provider</span>
                  <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">{user.provider}</span>
                </div>
                {user.discordLinked && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Discord User</span>
                      <span className="text-slate-300 font-mono bg-[#5865F2]/10 text-[#5865F2] px-2 py-0.5 rounded border border-[#5865F2]/20">{user.discordUsername}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Discord ID</span>
                      <span className="text-slate-300 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">{user.discordId}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-zinc-400 font-medium">Role</span>
                  <span className="text-red-400 font-bold tracking-widest text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-2 flex flex-col gap-1 border-t border-white/10">
              <button
                onClick={() => { setIsOpen(false); router.push('/dashboard/account'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Account Profile</span>
              </button>

              <button 
                onMouseDown={(e) => { e.preventDefault(); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
