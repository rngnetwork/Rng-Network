'use client';

import React from 'react';
import { ListChecks, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/common/feedback/Badge';

export interface DispatchLogEntry {
  id: string;
  timestamp: string;
  server: string;
  channel: string;
  status: 'SUCCESS' | 'SCHEDULED' | 'PENDING' | 'FAILED';
  message: string;
}

export interface DispatchLogsViewerProps {
  logs: DispatchLogEntry[];
  onClear: () => void;
}

export const DispatchLogsViewer: React.FC<DispatchLogsViewerProps> = ({
  logs,
  onClear,
}) => {
  return (
    <div className="p-5 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col gap-4 shadow-apple-card">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-apple-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ListChecks size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Live Dispatch Logs</h4>
            <span className="text-[11px] font-mono text-zinc-400">
              {logs.length} event{logs.length === 1 ? '' : 's'} recorded
            </span>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-apple-md text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No dispatches recorded in this session. Deliver an embed above to inspect live gateway telemetry.
          </div>
        ) : (
          logs.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            const isScheduled = log.status === 'SCHEDULED';
            const isFailed = log.status === 'FAILED';

            return (
              <div
                key={log.id}
                className="p-3 rounded-apple-lg bg-surface-canvas border border-white/[0.06] flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-500">
                      [{log.timestamp}]
                    </span>
                    <span className="font-semibold text-white truncate">
                      {log.server}
                    </span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      #{log.channel}
                    </span>
                  </div>
                  <p className="text-zinc-300 line-clamp-2 text-[11.5px] leading-relaxed">
                    {log.message}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isSuccess && (
                    <Badge variant="success" size="sm">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} /> SUCCESS
                      </span>
                    </Badge>
                  )}
                  {isScheduled && (
                    <Badge variant="warning" size="sm">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> SCHEDULED
                      </span>
                    </Badge>
                  )}
                  {isFailed && (
                    <Badge variant="crimson" size="sm">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={11} /> FAILED
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
