"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Info } from 'lucide-react';
import Image from 'next/image';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';

// Mock list of servers the user has access to
const MOCK_SERVERS = [
  { id: '112233', name: 'RNG Official Network', memberCount: 15420, icon: '/visuals/MAIN_LOGO.png' },
  { id: '445566', name: 'RNG Staff Hideout', memberCount: 42, icon: '/visuals/LOGO_FOR_STAFFS.png' }
];

export default function ServersPage() {
  const [toastVisible, setToastVisible] = useState(false);

  const handleServerClick = () => {
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E11D2E] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="w-full px-10 py-8 border-b border-white/5 bg-[#111111]/50 backdrop-blur-xl relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Image src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" width={40} height={40} unoptimized className="object-contain drop-shadow-[0_0_10px_rgba(225,29,46,0.4)]" />
           <h2 className="text-lg font-bold tracking-widest uppercase font-display">Select Server</h2>
        </div>
        <div className="flex items-center gap-4">
          <UserProfileDropdown />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-10 relative z-10 flex flex-col">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Your Infrastructures</h1>
          <p className="text-[#A0A0A0]">Select a Discord server to access its management dashboard.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SERVERS.map((server, idx) => (
            <motion.button
              key={server.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, type: 'spring' }}
              onClick={handleServerClick}
              className="group relative bg-[#111111] border border-white/5 rounded-[2rem] p-8 text-left transition-all duration-300 hover:border-[#E11D2E]/50 hover:bg-[#151515] hover:shadow-[0_10px_40px_-10px_rgba(225,29,46,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E11D2E] opacity-0 blur-[50px] group-hover:opacity-[0.05] transition-opacity duration-500 rounded-bl-full" />
              
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/10 p-2 shadow-inner overflow-hidden relative">
                   <Image src={server.icon} alt={server.name} fill unoptimized className="object-contain p-2" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1 truncate max-w-[150px]">{server.name}</h3>
                  <p className="text-[#A0A0A0] text-sm font-medium">{server.memberCount.toLocaleString()} Members</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[#777] group-hover:text-[#E11D2E] transition-colors relative z-10">
                <span className="text-sm font-semibold tracking-wide uppercase">Connect</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      {/* Custom Toast Message */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 text-white px-6 py-4 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-[#E11D2E]/20 flex items-center justify-center">
              <Info className="text-[#E11D2E]" size={16} />
            </div>
            <span className="font-semibold tracking-wide text-sm">Next Feature! (Coming Soon)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
