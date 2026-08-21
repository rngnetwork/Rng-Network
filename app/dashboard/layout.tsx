"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, UserProfileData } from '@/lib/api';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const loadSession = async () => {
      let token = localStorage.getItem('accessToken');

      if (token) {
        try {
          const userRes = await api.fetchCurrentUser(token);
          if (userRes.success && userRes.data) {
            setUser(userRes.data);
            setAuthState('authenticated');
            return;
          }
        } catch {
          // Token is expired, clear local storage
          localStorage.removeItem('accessToken');
          token = null;
        }
      }

      // Try cookie refresh if access token missing or expired
      try {
        const refreshRes = await api.refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          token = refreshRes.data.accessToken;
          localStorage.setItem('accessToken', token);
          const userRes = await api.fetchCurrentUser(token);
          if (userRes.success && userRes.data) {
            setUser(userRes.data);
            setAuthState('authenticated');
            return;
          }
        }
      } catch {
        // Refresh unavailable
      }

      localStorage.removeItem('accessToken');
      setAuthState('unauthenticated');
    };

    loadSession();
  }, [router]);

  const handleReturnToSignIn = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    try {
      await api.logout();
    } catch {
      // Ignored
    }
    router.push('/');
    router.refresh();
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen w-full bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
          <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">
            Loading Control Center...
          </span>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen w-full bg-[#080808] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600 opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full bg-[#111111]/80 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="text-red-500 w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">Authentication Required</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Your session has expired or you are signed out. You must sign in to access the RNG Control Center.
          </p>

          <button
            onClick={handleReturnToSignIn}
            className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,46,0.3)] transition-all"
          >
            <span>Return to Sign In</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#080808] text-white flex font-sans relative overflow-x-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-red-600/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[40vw] h-[40vw] bg-red-950/10 blur-[180px] rounded-full pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 md:h-20 px-6 md:px-10 border-b border-white/5 bg-[#080808]/70 backdrop-blur-xl flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Workspace:</span>
            <span className="text-xs font-mono font-semibold text-zinc-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              RNG Mainframe
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <UserProfileDropdown />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
