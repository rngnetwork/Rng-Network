"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  Zap,
  Server
} from 'lucide-react';

export default function ServerAnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full"
    >
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          Server Health Metrics & Localized Audit Logs
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Real-time cluster uptime, websocket latency, and state transition diff records.
        </p>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase">Uptime</span>
            <Activity size={15} className="text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono">99.98%</span>
          <span className="text-[10px] text-zinc-500 font-mono">Zero drops (last 30d)</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase">Health</span>
            <ShieldCheck size={15} className="text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono">Healthy</span>
          <span className="text-[10px] text-zinc-500 font-mono">Gateway sync normal</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase">WebSocket Latency</span>
            <Zap size={15} className="text-red-400" />
          </div>
          <span className="text-xl font-bold text-red-300 font-mono">16ms</span>
          <span className="text-[10px] text-zinc-500 font-mono">Discord REST heartbeat</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase">Active Shard</span>
            <Server size={15} className="text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono">Shard #01</span>
          <span className="text-[10px] text-zinc-500 font-mono">Cluster us-east-prod</span>
        </div>
      </div>

      {/* Audit Log Table with Diff Chips */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Guild Audit Trail</h3>
          <p className="text-xs text-zinc-400">Chronological history of setting changes and module state updates.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="text-[10px] uppercase font-mono text-zinc-500 bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer</th>
                <th className="py-3 px-4">Key / Parameter</th>
                <th className="py-3 px-4">State Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr>
                <td className="py-3.5 px-4 text-zinc-400">26/08/26 12:40</td>
                <td className="py-3.5 px-4 text-white font-semibold">Chief High Command</td>
                <td className="py-3.5 px-4 text-red-300">automod.spam_threshold</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/20 line-through mr-1.5">5</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">8</span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-zinc-400">25/08/26 19:15</td>
                <td className="py-3.5 px-4 text-white font-semibold">Tech Specialist</td>
                <td className="py-3.5 px-4 text-red-300">tickets.log_channel</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/20 line-through mr-1.5">#mod-log</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">#tickets-log</span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-zinc-400">24/08/26 08:30</td>
                <td className="py-3.5 px-4 text-white font-semibold">Minister of Tech</td>
                <td className="py-3.5 px-4 text-red-300">anti_nuke.guard</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20">enabled</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
