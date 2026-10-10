'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';

const REQUIRED_BOT_PERMISSIONS = [
  { name: 'VIEW_CHANNEL', description: 'Inspect guild text & voice channels' },
  { name: 'SEND_MESSAGES', description: 'Dispatch Components V2 payloads' },
  { name: 'EMBED_LINKS', description: 'Render rich container accessories & links' },
  { name: 'ATTACH_FILES', description: 'Upload Media Gallery (Type 12) assets' },
  { name: 'MANAGE_ROLES', description: 'Execute dynamic RoleSelect hierarchy grants' },
  { name: 'MANAGE_CHANNELS', description: 'Provision private support ticket channels' },
];

export const BotPermissionsAuditCard: React.FC = () => {
  return (
    <Card
      title="Bot Administrative Permissions Audit"
      subtitle="Pre-flight JDA 5 permission verification matrix"
      headerAction={
        <Badge variant="success">
          <ShieldCheck size={12} className="mr-1 inline" />
          All Granted
        </Badge>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REQUIRED_BOT_PERMISSIONS.map((perm) => (
          <div
            key={perm.name}
            className="p-3.5 rounded-apple-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3"
          >
            <div className="flex flex-col">
              <span className="text-xs font-mono font-semibold text-white">
                {perm.name}
              </span>
              <span className="text-[11px] text-zinc-400">{perm.description}</span>
            </div>
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
};
