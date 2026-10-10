'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchServerAnalytics,
  fetchInteractionLogs,
} from '@/lib/api/dashboard/servers/[serverId]/analytics';
import type { ServerAnalyticsData } from '@/lib/model/analytics';
import type { InteractionLogItem } from '@/lib/model/action';
import { AnalyticsOverviewGrid } from './AnalyticsOverviewGrid';
import { AnalyticsOverviewChart } from './AnalyticsOverviewChart';
import { ServerAuditLogTable } from './ServerAuditLogTable';

const INITIAL_ANALYTICS: ServerAnalyticsData = {
  serverId: '',
  totalDispatches: 0,
  totalInteractions: 0,
  successRatePercent: 100,
  averageLatencyMs: 0,
  activeActionTemplates: 0,
  series: [],
};

export const ServerAnalyticsCoordinator: React.FC = () => {
  const params = useParams();
  const serverId = (params?.serverId as string) || '';

  const [analytics, setAnalytics] = useState<ServerAnalyticsData>(INITIAL_ANALYTICS);
  const [logs, setLogs] = useState<InteractionLogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      const token = localStorage.getItem('accessToken') ?? undefined;
      if (!serverId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [analyticsRes, logsRes] = await Promise.allSettled([
          fetchServerAnalytics(serverId, token),
          fetchInteractionLogs(serverId, { page: currentPage - 1, size: 15 }, token),
        ]);

        if (isMounted) {
          if (
            analyticsRes.status === 'fulfilled' &&
            analyticsRes.value.success &&
            analyticsRes.value.data
          ) {
            setAnalytics(analyticsRes.value.data);
          }
          if (logsRes.status === 'fulfilled' && logsRes.value.success && logsRes.value.data) {
            setLogs(logsRes.value.data.items || []);
            setTotalPages(Math.max(1, logsRes.value.data.totalPages || 1));
          }
        }
      } catch {
        // Handled by empty states
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [serverId, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-brand-red rounded-full animate-spin shadow-crimson-glow" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <AnalyticsOverviewGrid analytics={analytics} />
      <AnalyticsOverviewChart series={analytics.series} />
      <ServerAuditLogTable
        logs={logs}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
