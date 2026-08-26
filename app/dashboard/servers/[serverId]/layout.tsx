"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';
import { ServerStatsHeader } from '@/components/server/ServerStatsHeader';
import { Navbar } from '@/components/server/Navbar';

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadServer = async () => {
      try {
        const found = await mockServersApi.getServerById(serverId);
        if (isMounted) {
          setServer(found);
        }
      } catch (err) {
        console.error('Failed to load server:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServer();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="p-8 rounded-3xl bg-[#111111]/70 border border-white/10 text-center max-w-lg mx-auto">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Server Not Found</h2>
        <p className="text-sm text-zinc-400 mb-6">
          The requested Discord guild could not be found or has not been authorized.
        </p>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(225,29,46,0.3)]"
        >
          <ArrowLeft size={16} />
          Return to Servers
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/servers"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Server Management</span>
        </Link>
      </div>

      {/* BOX 1: Top Server Stats Header Component */}
      <ServerStatsHeader server={server} />

      {/* BOX 2: Bottom Box containing Navbar + Children */}
      <div className="rounded-3xl bg-[#0e0e0e]/90 border border-red-500/20 p-6 md:p-8 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,46,0.12)] flex flex-col gap-6">
        {/* Horizontal Navigation Bar Component */}
        <Navbar serverId={serverId} />

        {/* Child Pages (Settings, Bot Modules, Embeds, Analytics) */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
