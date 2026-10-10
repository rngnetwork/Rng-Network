'use client';

import React from 'react';
import { Send, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DispatchLogData } from '@/lib/model/dispatch';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface RecentDispatchesListProps {
  logs: DispatchLogData[];
}

export const RecentDispatchesList: React.FC<RecentDispatchesListProps> = ({ logs }) => {
  return (
    <Card title="Recent Bot Dispatches" subtitle="Live Discord REST API v10 telemetry">
      {logs.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-500">
          No recent embed dispatches recorded across managed guilds.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {logs.map((log) => {
            const isSuccess = log.status === 'DELIVERED' || log.status === 'SUCCESS';
            const isScheduled = log.status === 'SCHEDULED' || log.type?.includes('SCHEDULED');

            return (
              <div
                key={log.id || log.dispatchId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-apple-md bg-white/[0.04] border border-white/10 text-zinc-300 shrink-0">
                    {isScheduled ? (
                      <Clock size={16} className="text-amber-400" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate font-mono">
                      Channel #{log.channelId} · Guild {log.serverId}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Operator: {log.operatorUsername || `#${log.operatorId}`} ·{' '}
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {typeof log.latencyMs === 'number' && (
                    <span className="text-xs font-mono text-zinc-400">{log.latencyMs}ms</span>
                  )}
                  <Badge
                    variant={
                      isSuccess ? 'success' : isScheduled ? 'warning' : 'danger'
                    }
                  >
                    <Send size={11} className="mr-1 inline" />
                    {log.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
