'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Server, Boxes, ArrowRight } from 'lucide-react';
import { fetchDashboardOverviewStats } from '@/lib/api/dashboard';
import { fetchDispatchLogs } from '@/lib/api/dashboard/embeds';
import type { DashboardStats } from '@/lib/model/analytics';
import type { DispatchLogData } from '@/lib/model/dispatch';
import { Button } from '@/components/common/input/Button';
import { DashboardMetricsOverview } from './DashboardMetricsOverview';
import { DashboardRecentActivity } from './DashboardRecentActivity';

const INITIAL_STATS: DashboardStats = {
  totalManagedServers: 0,
  totalWhitelistedPersonnel: 0,
  totalTemplatesSaved: 0,
  totalDispatches24h: 0,
  gatewayStatus: 'DISCONNECTED',
  averageLatencyMs: 0,
};

export const DashboardOverviewCoordinator: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [recentLogs, setRecentLogs] = useState<DispatchLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [statsRes, logsRes] = await Promise.allSettled([
          fetchDashboardOverviewStats(token),
          fetchDispatchLogs({ page: 0, size: 8 }, token),
        ]);

        if (isMounted) {
          if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
            setStats(statsRes.value.data);
          }
          if (logsRes.status === 'fulfilled' && logsRes.value.success && logsRes.value.data) {
            setRecentLogs(logsRes.value.data.content || []);
          }
        }
      } catch {
        // Handled by global error interceptor
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-white/10 border-t-brand-red rounded-full animate-spin shadow-crimson-glow" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Command Overview
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Real-time Discord JDA 5 gateway telemetry, personnel clearance, and Components V2 dispatch metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Boxes size={16} />}
            onClick={() => router.push('/dashboard/embeds')}
          >
            Embed Builder
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Server size={16} />}
            rightIcon={<ArrowRight size={16} />}
            onClick={() => router.push('/dashboard/servers')}
          >
            Manage Servers
          </Button>
        </div>
      </div>

      <DashboardMetricsOverview stats={stats} />
      <DashboardRecentActivity logs={recentLogs} />
    </div>
  );
};
