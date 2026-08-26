"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Layers } from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';

export default function BotConfigPage() {
  const params = useParams();
  const serverId = params?.serverId as string;
  const [server, setServer] = useState<ServerData | null>(null);

  useEffect(() => {
    mockServersApi.getServerById(serverId).then((res) => setServer(res));
  }, [serverId]);

  const previewModules = [
    'Moderation & AutoMod',
    'Verification Gatekeeper',
    'Anti-Nuke Protection',
    'Ticket Support Center',
    'Audit & Action Logging',
    'Welcome & Onboarding',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center p-8 md:p-14 text-center max-w-2xl mx-auto"
    >
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5 shadow-[0_0_25px_rgba(225,29,46,0.3)]">
        <Bot size={32} />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-mono font-semibold">
          Next Feature
        </span>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
        Bot Module Configuration
      </h2>

      <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-8 max-w-lg">
        Individual module toggles, custom command triggers, and automod thresholds for{' '}
        <span className="text-white font-semibold">{server?.name || 'this server'}</span> are scheduled for the next development phase.
      </p>

      {/* Feature Preview Pills */}
      <div className="w-full p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 text-left">
        <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
          <Layers size={13} className="text-red-400" />
          Planned Server Modules:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {previewModules.map((mod) => (
            <div
              key={mod}
              className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 flex items-center gap-2 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
              <span>{mod}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
