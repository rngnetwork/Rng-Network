'use client';

import React from 'react';
import type { InteractionLogItem } from '@/lib/model/action';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';
import { Table, ColumnDef } from '@/components/common/containers/Table';
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
  const columns: ColumnDef<InteractionLogItem & Record<string, unknown>>[] = [
    {
      header: 'Action ID',
      accessorKey: 'actionId',
      className: 'font-mono text-zinc-200',
      sortable: true,
    },
    {
      header: 'Type',
      accessorKey: 'actionType',
      cell: (log) => <Badge variant="crimson">{log.actionType}</Badge>,
      sortable: true,
    },
    {
      header: 'Member',
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
      sortable: true,
    },
    {
      header: 'Timestamp',
      className: 'text-right font-mono text-zinc-400',
      cell: (log) => new Date(log.createdAt).toLocaleString(),
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
      <Table<InteractionLogItem & Record<string, unknown>>
        data={logs as (InteractionLogItem & Record<string, unknown>)[]}
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
