'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchServerDetails } from '@/lib/api/dashboard/servers/[serverId]';
import type { ServerDetail } from '@/lib/model/server';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { ServerContextBanner } from './ServerContextBanner';
import { ServerNavigationSubNav } from './ServerNavigationSubNav';

export interface ServerDetailShellClientProps {
  children: React.ReactNode;
}

export const ServerDetailShellClient: React.FC<ServerDetailShellClientProps> = ({
  children,
}) => {
  const params = useParams();
  const serverId = (params?.serverId as string) || '';

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-brand-red transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Server Management</span>
        </Link>
      </div>

      <ServerContextBanner server={server} />

      <div className="rounded-apple-xl bg-zinc-900/90 border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-apple-card flex flex-col gap-6">
        <ServerNavigationSubNav serverId={serverId} />
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};
