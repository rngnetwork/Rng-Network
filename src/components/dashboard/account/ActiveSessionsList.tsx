'use client';

import React from 'react';
import { Monitor, Trash2, ShieldCheck } from 'lucide-react';
import type { ActiveSessionItem } from '@/lib/model/user';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';

export interface ActiveSessionsListProps {
  sessions: ActiveSessionItem[];
  onRevokeSession?: (sessionId: string) => void;
  revokingId?: string | null;
}

export const ActiveSessionsList: React.FC<ActiveSessionsListProps> = ({
  sessions,
  onRevokeSession,
  revokingId = null,
}) => {
  return (
    <Card
      title="Authenticated Sessions"
      subtitle="Active JWT & Refresh Token Redis sessions"
      headerAction={
        <Badge variant="success">
          <ShieldCheck size={12} className="mr-1 inline" />
          2FA Verified
        </Badge>
      }
    >
      {sessions.length === 0 ? (
        <div className="p-4 rounded-apple-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-apple-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Monitor size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Current Browser Session</span>
              <span className="text-xs text-zinc-400 font-mono">
                SCOPE_FULLY_AUTHENTICATED · HttpOnly Refresh Cookie Active
              </span>
            </div>
          </div>
          <Badge variant="success">Current</Badge>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-3.5 rounded-apple-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-apple-md bg-white/5 border border-white/10 text-zinc-300 shrink-0">
                  <Monitor size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {session.userAgent}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    IP: {session.ipAddress} · Last Active:{' '}
                    {new Date(session.lastActiveAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {session.current ? (
                  <Badge variant="success">Current</Badge>
                ) : (
                  onRevokeSession && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      isLoading={revokingId === session.id}
                      onClick={() => onRevokeSession(session.id)}
                      leftIcon={<Trash2 size={13} />}
                    >
                      Revoke
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
