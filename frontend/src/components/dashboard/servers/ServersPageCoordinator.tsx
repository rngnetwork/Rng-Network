'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Server, AlertCircle } from 'lucide-react';
import { fetchUserManagedServers } from '@/lib/api/dashboard/servers';
import type { ServerItem } from '@/lib/model/server';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { ServerSearchFilter } from './ServerSearchFilter';
import { ManagedServersGrid } from './ManagedServersGrid';

export const ServersPageCoordinator: React.FC = () => {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadServers = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetchUserManagedServers(token);
        if (isMounted) {
          if (res.success && res.data) {
            setServers(res.data);
          } else {
            setError(res.message || 'Failed to load Discord servers.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Network error loading servers.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadServers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const filteredServers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return servers;
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [servers, searchQuery]);

  const handleManageServer = (server: ServerItem) => {
    router.push(`/dashboard/servers/${server.slug || server.id}/settings`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Discovering Managed Guilds..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-apple-xl bg-zinc-900/70 border border-brand-red/30 text-center max-w-lg mx-auto">
        <AlertCircle size={36} className="text-brand-red mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Servers</h2>
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
        <Button type="button" variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <Server size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Server Management
              </h1>
              <Badge variant="crimson">{servers.length} Servers</Badge>
            </div>
            <p className="text-xs md:text-sm text-zinc-400">
              Manage Discord guilds, Components V2 embeds, and bot configurations across RNG Network.
            </p>
          </div>
        </div>
      </div>

      <ServerSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={servers.length}
      />

      <ManagedServersGrid
        servers={filteredServers}
        onManageServer={handleManageServer}
      />
    </div>
  );
};
