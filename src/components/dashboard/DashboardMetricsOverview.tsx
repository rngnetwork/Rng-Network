'use client';

import React from 'react';
import type { DashboardStats } from '@/lib/model/analytics';
import { OverviewMetricsGrid } from './OverviewMetricsGrid';

export interface DashboardMetricsOverviewProps {
  stats: DashboardStats;
}

export const DashboardMetricsOverview: React.FC<DashboardMetricsOverviewProps> = ({ stats }) => {
  return (
    <section aria-label="Control Center Telemetry Overview" className="w-full">
      <OverviewMetricsGrid stats={stats} />
    </section>
  );
};
