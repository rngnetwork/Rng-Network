'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchServerDetails } from '@/lib/api/dashboard/servers/[serverId]';
import type { ServerDetail } from '@/lib/model/server';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { ServerContextBanner } from './ServerContextBanner';
import { ServerNavigationTabStrip } from './ServerNavigationTabStrip';

export interface ServerDetailShellClientProps {
  children: React.ReactNode;
}

export const ServerDetailShellClient: React.FC<ServerDetailShellClientProps> = ({
  children,
}) => {
  const params = useParams();
  const pathname = usePathname();
  const serverId = (params?.serverId as string) || '';
  const isEmbedRoute = pathname?.includes('/embeds') ?? false;

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadServer = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token || !serverId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await fetchServerDetails(token, serverId);
        if (isMounted && res.success && res.data) {
          setServer(res.data);
        }
      } catch {
        // Handled by fallback view
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadServer();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Synchronizing Gateway State..." />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-8 rounded-apple-xl bg-zinc-900/70 border border-white/10 text-center max-w-lg mx-auto">
        <AlertCircle size={32} className="text-brand-red mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Server Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">
          The requested Discord guild could not be found or has not been authorized.
        </p>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-apple-md bg-brand-red hover:bg-brand-red-hover text-white text-sm font-semibold transition-all shadow-crimson-glow"
        >
          <ArrowLeft size={16} />
          Return to Servers
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col w-full max-w-7xl mx-auto ${
        isEmbedRoute
          ? 'h-full flex-1 min-h-0 overflow-hidden gap-2 md:gap-3'
          : 'gap-6'
      }`}
    >
      <div className="shrink-0">
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-brand-red transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Server Management</span>
        </Link>
      </div>

      <div className="shrink-0">
        <ServerContextBanner server={server} />
      </div>

      <div
        className={`rounded-apple-xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-apple-card flex flex-col ${
          isEmbedRoute
            ? 'p-2.5 sm:p-3 md:p-4 flex-1 min-h-0 gap-2 md:gap-2.5 overflow-hidden'
            : 'p-6 md:p-8 gap-6'
        }`}
      >
        <div className="shrink-0">
          <ServerNavigationTabStrip serverId={serverId} />
        </div>
        <div
          className={
            isEmbedRoute
              ? 'w-full flex-1 min-h-0 flex flex-col overflow-hidden'
              : 'w-full'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};
