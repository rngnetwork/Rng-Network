'use client';

import React from 'react';
import { Shield, CheckCircle2, Lock } from 'lucide-react';
import type { ServerRole } from '@/lib/model/role';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

export interface ServerRoleHierarchyListProps {
  roles: ServerRole[];
}

export const ServerRoleHierarchyList: React.FC<ServerRoleHierarchyListProps> = ({
  roles,
}) => {
  const sorted = [...roles].sort((a, b) => b.position - a.position);

  return (
    <Card
      title="Guild Role Hierarchy & Bot Assignability"
      subtitle="Live JDA 5 role positions and pure Discord hierarchy linting"
      headerAction={
        <Badge variant="neutral">
          <Shield size={12} className="mr-1 inline" />
          {roles.length} Roles
        </Badge>
      }
    >
      {sorted.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          No guild roles synchronized from Discord Gateway cache.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {sorted.map((role) => (
            <div
              key={role.id}
              className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: role.colorHex || '#71717a' }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {role.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Pos #{role.position}
                  </span>
                </div>
              </div>

              {role.assignableByBot && !role.managed ? (
                <Badge variant="success">
                  <CheckCircle2 size={10} className="mr-1 inline" />
                  Assignable
                </Badge>
              ) : (
                <Badge variant="neutral">
                  <Lock size={10} className="mr-1 inline" />
                  {role.managed ? 'Managed' : 'Above Bot'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
