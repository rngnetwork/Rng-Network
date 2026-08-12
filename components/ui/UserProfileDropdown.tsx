"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
=======

>>>>>>> 8c7f9b47e8be3b0660f75655d77d1ffe8ce2d802
import { api } from '@/lib/api';

interface UserData {
  email: string;
  fullName: string;
  provider: string;
  discordId: string;
  discordUsername: string;
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
    // Simulate backend DTO fetch
    const fetchUser = async () => {
<<<<<<< HEAD
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
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          username: 'Guest Staff',
          id: 'STAFF-001',
          role: 'STAFF',
        });
        return;
      }

      try {
        const res = await api.fetchCurrentUser(accessToken);
        if (res.success && res.data) {
          setUser({
            avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
            username: res.data.discordUsername || res.data.email,
            id: res.data.discordId || `USER-${res.data.id}`,
            role: res.data.role || 'STAFF',
          });
        }
      } catch {
        setUser({
          avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
          username: 'RNG Staff Member',
          id: 'ID: 1',
          role: 'STAFF',
        });
      }
=======
      setUser({
        email: "testuser@rng.com",
        fullName: "Test User",
        provider: "EMAIL",
        discordId: "123456789012345678",
        discordUsername: "discord_user#0",
        discordLinked: true,
        role: "ROLE_USER",
        avatar: "/visuals/staff.png"
      });
>>>>>>> 8c7f9b47e8be3b0660f75655d77d1ffe8ce2d802
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

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:border-[#E11D2E]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/50"
      >
        <Image src={user.avatar} alt="Profile" fill unoptimized className="object-cover" />
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
                  <Image src={user.avatar} alt="Profile" fill unoptimized className="object-cover" />
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
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className="text-[#E11D2E] font-bold tracking-widest text-[10px] bg-[#E11D2E]/10 border border-[#E11D2E]/20 px-2 py-1 rounded-md uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-2 border-t border-white/10">
              <button 
                onMouseDown={(e) => { e.preventDefault(); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#E11D2E] hover:bg-[#E11D2E]/10 rounded-lg transition-colors font-medium"
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
