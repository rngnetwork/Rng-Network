'use client';

import React from 'react';
import type { InteractionLogItem } from '@/lib/model/action';
import { Card } from '@/components/common/containers/Card';
import { Table, type ColumnDef } from '@/components/common/containers/Table';
import { Badge } from '@/components/common/feedback/Badge';
import { Pagination } from '@/components/common/navigation/Pagination';

export interface ServerAuditLogTableProps {
  logs: InteractionLogItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type LogRow = InteractionLogItem & Record<string, unknown>;

export const ServerAuditLogTable: React.FC<ServerAuditLogTableProps> = ({
  logs,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const columns: ColumnDef<LogRow>[] = [
    {
      header: 'Action ID',
      accessorKey: 'actionId',
      cell: (log) => <span className="font-mono text-zinc-200">{log.actionId}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'actionType',
      cell: (log) => <Badge variant="crimson">{log.actionType}</Badge>,
    },
    {
      header: 'Member',
      accessorKey: 'username',
      cell: (log) => (
        <span className="font-mono">
          {log.username} ({log.userId})
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (log) => (
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
      ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      className: 'text-right',
      cell: (log) => (
        <span className="font-mono text-zinc-400">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

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
      <Table<LogRow>
        data={logs as LogRow[]}
        columns={columns}
        emptyState={
          <div className="py-10 text-center text-xs text-zinc-500">
            No interactive component audit events recorded for this server.
          </div>
        }
      />
    </Card>
  );
};
