'use client';

import React from 'react';
import type { ClientValidationReport } from '@/lib/model/embed';
import { GlobalDispatchCoordinator } from '@/components/dashboard/embeds/DispatchTab/GlobalDispatchCoordinator';

export interface ServerScheduleDispatchPanelProps {
  serverId: string;
  validationReport: ClientValidationReport;
}

export const ServerScheduleDispatchPanel: React.FC<
  ServerScheduleDispatchPanelProps
> = ({ serverId, validationReport }) => {
  return (
    <GlobalDispatchCoordinator
      validationReport={validationReport}
      fixedServerId={serverId}
    />
  );
};
