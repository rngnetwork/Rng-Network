'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ClientValidationReport } from '@/lib/model/embed';
import type { DryRunValidationReportData } from '@/lib/model/dispatch';
import { Badge } from '@/components/common/feedback/Badge';

export interface PreflightLintStatusCardProps {
  clientReport: ClientValidationReport;
  serverReport?: DryRunValidationReportData | null;
}

export const PreflightLintStatusCard: React.FC<
  PreflightLintStatusCardProps
> = ({ clientReport, serverReport }) => {
  const isAllValid =
    clientReport.valid && (serverReport ? serverReport.valid : true);

  return (
    <div className="p-5 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isAllValid ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={18} className="text-amber-400" />
          )}
          <div>
            <h3 className="text-sm font-bold text-white">
              Pre-Flight Structural & Permission Linting
            </h3>
            <p className="text-[11px] text-zinc-400">
              Discord Components V2 (`flags: 32768`) & Bot Channel Permissions
            </p>
          </div>
        </div>

        <Badge variant={isAllValid ? 'success' : 'warning'}>
          {isAllValid
            ? 'READY FOR DISPATCH'
            : `${clientReport.violations.length} VIOLATIONS`}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            Containers (Max 10)
          </span>
          <p className="text-base font-bold text-white mt-0.5">
            {clientReport.totalContainers}/10
          </p>
        </div>

        <div className="p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            Components (Max 40)
          </span>
          <p className="text-base font-bold text-white mt-0.5">
            {clientReport.totalComponents}/40
          </p>
        </div>

        <div className="p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            Action Rows (Max 5)
          </span>
          <p className="text-base font-bold text-white mt-0.5">
            {clientReport.totalActionRows}/5
          </p>
        </div>

        <div className="p-3 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <span className="text-[10px] font-mono uppercase text-zinc-400">
            Char Budget (4000)
          </span>
          <p className="text-base font-bold text-white mt-0.5">
            {clientReport.cumulativeCharacters}/4000
          </p>
        </div>
      </div>

      {clientReport.violations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {clientReport.violations.map((v, idx) => (
            <div
              key={`${v.code}_${idx}`}
              className="px-3 py-2 rounded-apple-md bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2"
            >
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                <strong className="font-mono">{v.code}:</strong> {v.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {serverReport && (
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-brand-red" />
            Server Pre-Flight Dry Run:
          </span>
          <span className="font-mono">
            {serverReport.valid ? 'Permissions Verified' : 'Check Failed'}
          </span>
        </div>
      )}
    </div>
  );
};
