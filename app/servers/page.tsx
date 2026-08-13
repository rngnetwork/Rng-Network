"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ShieldAlert, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';

// User has no connected servers initially

export default function ServersPage() {
  const [toastVisible] = useState(false);
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      let token = localStorage.getItem('accessToken');

      if (!token) {
        try {
          const refreshRes = await api.refreshToken();
          if (refreshRes.success && refreshRes.data?.accessToken) {
            token = refreshRes.data.accessToken;
            localStorage.setItem('accessToken', token);
          }
        } catch {
          // Token refresh unavailable
        }
      }

      if (token) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
        const timer = setTimeout(() => {
          router.push('/');
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    verifySession();
  }, [router]);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen w-full bg-[#090909] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-[#E11D2E] rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E11D2E] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#E11D2E]/10 border border-[#E11D2E]/20 flex items-center justify-center mb-6">
            <ShieldAlert className="text-[#E11D2E] w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight">Authentication Required</h2>
          <p className="text-[#A0A0A0] text-sm mb-6 leading-relaxed">
            Your session has expired or you are signed out. You must sign in to access the RNG Control Center. Redirecting to sign in page...
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 rounded-xl bg-[#E11D2E] hover:bg-[#FF3B4D] text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,46,0.3)] transition-all"
          >
            <span>Return to Sign In</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#090909] text-white flex flex-col font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#E11D2E] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <header className="w-full px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-[#111111]/50 backdrop-blur-xl relative z-40 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
           <Image src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" width={36} height={36} unoptimized className="object-contain drop-shadow-[0_0_10px_rgba(225,29,46,0.4)] md:w-10 md:h-10" />
           <h2 className="text-base md:text-lg font-bold tracking-widest uppercase font-display hidden sm:block">Select Server</h2>
        </div>
        <div className="flex items-center gap-4">
          <UserProfileDropdown />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-10 relative z-10 flex flex-col">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-3 tracking-tight">New feature soon</h1>
          <p className="text-[#A0A0A0] text-sm md:text-base">New feature soon</p>
        </div>

        <div className="flex flex-col items-center justify-center p-12 mt-4 border border-dashed border-white/10 rounded-3xl bg-[#111111]/30">
          <p className="text-[#A0A0A0] text-center font-medium">New feature Soon</p>
        </div>
      </main>

      {/* Custom Toast Message */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
            className="fixed top-10 left-1/2 z-50 flex items-center gap-3 bg-[#1A1A1A] border border-white/10 text-white px-6 py-4 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md"
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
