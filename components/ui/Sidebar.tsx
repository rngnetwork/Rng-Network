"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Ticket, 
  ShieldAlert, 
  Swords, 
  Users, 
  FileText, 
  BarChart3, 
  ScrollText, 
  Settings,
  LogOut
} from 'lucide-react';
import { mockAuthApi } from '@/lib/auth/mockApi';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ icon, label, isActive }: NavItemProps) => (
  <button 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
      isActive 
        ? 'bg-[#E11D2E]/10 text-white' 
        : 'text-[#A0A0A0] hover:text-white hover:bg-white/5'
    }`}
  >
    {isActive && (
      <motion.div 
        layoutId="sidebar-active-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#E11D2E] rounded-r-full shadow-[0_0_10px_rgba(225,29,46,0.8)]"
      />
    )}
    <div className={`transition-colors ${isActive ? 'text-[#E11D2E]' : 'text-[#A0A0A0] group-hover:text-white'}`}>
      {icon}
    </div>
    <span className="font-medium text-sm tracking-wide">{label}</span>
  </button>
);

export function Sidebar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching user session from backend
    const fetchUser = async () => {
      const res = await mockAuthApi.simulateDiscordOAuth('staff');
      if (res.success) {
        setUser(res.data?.user);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="w-[280px] h-screen bg-[#090909] border-r border-white/5 flex flex-col flex-shrink-0 relative overflow-hidden font-sans">
      {/* Subtle cinematic glow in the top left corner of the sidebar */}
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[20%] bg-[#E11D2E] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />

      {/* Header / Logo */}
      <div className="px-6 py-8 flex items-center gap-4 relative z-10">
        <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(225,29,46,0.4)]" />
        <div>
          <h2 className="text-white font-bold tracking-widest uppercase text-sm font-display">RNG Network</h2>
          <p className="text-[#A0A0A0] text-[10px] tracking-widest uppercase">Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="mb-4 px-3 text-[10px] font-bold tracking-[0.2em] text-[#555] uppercase">Core</div>
        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive />
        <NavItem icon={<Ticket size={18} />} label="Tickets" />
        <NavItem icon={<ShieldAlert size={18} />} label="Punishments" />
        <NavItem icon={<Swords size={18} />} label="Moderation" />
        <NavItem icon={<Users size={18} />} label="Members" />
        
        <div className="mt-6 mb-4 px-3 text-[10px] font-bold tracking-[0.2em] text-[#555] uppercase">System</div>
        <NavItem icon={<FileText size={18} />} label="Applications" />
        <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
        <NavItem icon={<ScrollText size={18} />} label="Logs" />
        <NavItem icon={<Settings size={18} />} label="Settings" />
      </div>

      {/* User Card (Bottom) */}
      <div className="p-4 relative z-10">
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col gap-3 transition-colors hover:border-white/10 hover:bg-[#151515]">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                {/* Online Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#23a559] rounded-full border-2 border-[#111111]" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm truncate block">{user.username}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="bg-[#E11D2E]/20 text-[#E11D2E] text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md">Staff</span>
                  <span className="text-[#555] text-[10px] truncate">ID: {user.discordId || '1234567890'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-white/5 rounded" />
                <div className="h-2 w-12 bg-white/5 rounded" />
              </div>
            </div>
          )}
          
          <div className="h-[1px] w-full bg-white/5 my-1" />
          
          <button className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#E11D2E] text-xs font-semibold uppercase tracking-wider p-1 transition-colors w-full">
            <LogOut size={14} />
            Logout Session
          </button>
        </div>
      </div>
    </div>
  );
}
