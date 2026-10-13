'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCurrentUser, logout, refreshToken } from '@/lib/api/auth/session';
import type { UserProfileData } from '@/lib/model/user';
import { Button } from '@/components/common/input/Button';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { DashboardSidebarNav } from './DashboardSidebarNav';
import { DashboardAppHeader } from './DashboardAppHeader';

export interface DashboardShellClientProps {
  children: React.ReactNode;
}

export const DashboardShellClient: React.FC<DashboardShellClientProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isEmbedRoute = pathname?.includes('/embeds') ?? false;
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      let token = localStorage.getItem('accessToken');

      if (token) {
        try {
          const userRes = await fetchCurrentUser(token);
          if (isMounted && userRes.success && userRes.data) {
            setUser(userRes.data);
            setAuthState('authenticated');
            return;
          }
        } catch {
          localStorage.removeItem('accessToken');
          token = null;
        }
      }

      try {
        const refreshRes = await refreshToken();
        if (refreshRes.success && refreshRes.data?.accessToken) {
          token = refreshRes.data.accessToken;
          localStorage.setItem('accessToken', token);
          const userRes = await fetchCurrentUser(token);
          if (isMounted && userRes.success && userRes.data) {
            setUser(userRes.data);
            setAuthState('authenticated');
            return;
          }
        }
      } catch {
        // Refresh token unavailable
      }

      if (isMounted) {
        localStorage.removeItem('accessToken');
        setAuthState('unauthenticated');
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReturnToSignIn = async () => {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
    await logout();
    router.push('/auth/login');
    router.refresh();
  };

  if (authState === 'loading') {
    return <RngLoadingSpinner fullScreen size="xl" label="Loading Control Center..." />;
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen w-full bg-surface-canvas text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-zinc-900/80 border border-white/10 rounded-apple-xl p-8 shadow-apple-modal backdrop-blur-xl flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-apple-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mb-6 shadow-crimson-glow">
            <ShieldAlert className="text-brand-red w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">
            Authentication Required
          </h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Your session has expired or you are signed out. Authenticate to access the RNG Control Center.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => void handleReturnToSignIn()}
            rightIcon={<ArrowRight size={18} />}
            className="w-full"
          >
            Return to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-surface-canvas text-white flex relative ${
        isEmbedRoute
          ? 'h-screen max-h-screen overflow-hidden'
          : 'min-h-screen overflow-x-hidden'
      }`}
    >
      <button
        type="button"
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-50 items-center justify-center w-5 h-12 bg-zinc-900 hover:bg-brand-red text-zinc-400 hover:text-white border border-l-0 border-white/20 rounded-r-md shadow-apple-card transition-all duration-300 ease-in-out cursor-pointer group"
        style={{ left: sidebarCollapsed ? '0px' : '256px' }}
        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={13} className="transition-transform group-hover:scale-110" />
        ) : (
          <ChevronLeft size={13} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      <DashboardSidebarNav user={user} isCollapsed={sidebarCollapsed} />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isEmbedRoute
            ? 'h-screen max-h-screen overflow-hidden pt-16 md:pt-0'
            : 'min-h-screen pt-16 md:pt-0'
        } ${sidebarCollapsed ? 'md:pl-0' : 'md:pl-64'}`}
      >
        <DashboardAppHeader
          user={user}
          isHeaderCollapsed={headerCollapsed}
          onToggleHeader={() => setHeaderCollapsed((prev) => !prev)}
        />

        <main
          className={
            isEmbedRoute
              ? 'flex-1 min-h-0 p-3 md:p-4 w-full flex flex-col overflow-hidden'
              : 'flex-1 p-4 md:p-6 w-full'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};
