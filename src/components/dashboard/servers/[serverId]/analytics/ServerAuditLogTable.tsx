'use client';

import React from 'react';
import type { InteractionLogItem } from '@/lib/model/action';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';
import { Pagination } from '@/components/common/navigation/Pagination';

export interface ServerAuditLogTableProps {
  logs: InteractionLogItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ServerAuditLogTable: React.FC<ServerAuditLogTableProps> = ({
  logs,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <Card
      title="Interactive Component Audit Log"
      subtitle="30-day TTL retained interaction executions (rng_act_*)"
      footer={
        totalPages > 1 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ) : undefined
      }
    >
      {logs.length === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-500">
          No interactive component audit events recorded for this server.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="uppercase tracking-wider text-zinc-500 border-b border-white/[0.06] font-mono">
              <tr>
                <th className="py-3 px-4">Action ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono text-zinc-200">{log.actionId}</td>
                  <td className="py-3 px-4">
                    <Badge variant="crimson">{log.actionType}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {log.username} ({log.userId})
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        log.status === 'SUCCESS'
                          ? 'success'
                          : log.status === 'RATE_LIMITED'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
