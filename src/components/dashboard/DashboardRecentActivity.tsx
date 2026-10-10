'use client';

import React from 'react';
import type { DispatchLogData } from '@/lib/model/dispatch';
import { RecentDispatchesList } from './RecentDispatchesList';

export interface DashboardRecentActivityProps {
  logs: DispatchLogData[];
}

export const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({ logs }) => {
  return (
    <section aria-label="Recent Dispatch Telemetry" className="w-full">
      <RecentDispatchesList logs={logs} />
    </section>
  );
};
