'use client';

import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export interface DispatchLogEntry {
  id: string;
  timestamp: string;
  server: string;
  channel: string;
  status: 'SUCCESS' | 'SCHEDULED' | 'PENDING' | 'FAILED';
  message: string;
  statusCode?: string | number;
  rawDetails?: string;
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
    <div className="rounded-apple-xl bg-[#0c0d10] border border-white/10 flex flex-col shadow-2xl overflow-hidden font-mono h-full flex-1 min-h-0">
      {/* macOS Terminal Titlebar */}
      <div className="h-9 px-3.5 bg-[#16181d] border-b border-white/[0.08] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block" />
          </div>
          <span className="text-[11px] text-zinc-400 font-medium ml-2 flex items-center gap-1.5">
            <Terminal size={12} className="text-zinc-500" />
            dispatch.log
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500">
            {logs.length} event{logs.length === 1 ? '' : 's'}
          </span>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear terminal logs"
            >
              <Trash2 size={11} />
              clear
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="p-4 flex-1 min-h-[300px] overflow-y-auto text-[11px] leading-relaxed flex flex-col gap-3 text-zinc-300 [scrollbar-width:thin]">
        {logs.length === 0 ? (
          <div className="py-24 flex-1 flex flex-col items-center justify-center select-none">
            <div className="flex items-center font-mono text-2xl tracking-tight text-zinc-500">
              <span className="text-zinc-400 font-bold">&gt;</span>
              <span className="animate-pulse font-bold text-zinc-300">_</span>
            </div>
          </div>
        ) : (
          logs.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            const isScheduled = log.status === 'SCHEDULED';
            const isFailed = log.status === 'FAILED';

            return (
              <div
                key={log.id}
                className="flex flex-col gap-1 p-2.5 rounded-apple-sm bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">[{log.timestamp}]</span>
                    {isSuccess && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        SUCCESS 200
                      </span>
                    )}
                    {isScheduled && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        SCHEDULED
                      </span>
                    )}
                    {isFailed && (
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        ERROR {log.statusCode || 'FAILED'}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-500 text-[10px]">
                    {log.server} • #{log.channel}
                  </span>
                </div>

                <div className="text-zinc-300 whitespace-pre-wrap pl-2 border-l border-zinc-700/50 mt-0.5">
                  <span className={isFailed ? 'text-red-300' : 'text-zinc-300'}>
                    {log.message}
                  </span>
                  {log.rawDetails && (
                    <pre className="mt-1.5 p-2 rounded bg-black/50 text-[10px] text-zinc-400 overflow-x-auto border border-white/[0.05]">
                      {log.rawDetails}
                    </pre>
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
