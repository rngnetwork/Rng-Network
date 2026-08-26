"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Sparkles,
  Palette,
  LayoutTemplate,
  CheckCircle2
} from 'lucide-react';

export default function ServerEmbedsPage() {
  const [embedTitle, setEmbedTitle] = useState('Official Server Announcement');
  const [embedDesc, setEmbedDesc] = useState('Welcome to the official communication hub of RNG Network. Review rules and verify your roles.');
  const [embedColor, setEmbedColor] = useState('#E11D2E');
  const [targetChannel, setTargetChannel] = useState('#announcements');
  const [toast, setToast] = useState<string | null>(null);

  const handleDispatch = () => {
    setToast(`Embed successfully dispatched to ${targetChannel}!`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0a180f]/95 border border-emerald-500/40 text-white shadow-[0_0_25px_rgba(52,211,153,0.25)] backdrop-blur-2xl">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          Server-Scoped Embed Dispatcher
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Compose and dispatch interactive Discord embeds with buttons, select menus, and hex accents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <LayoutTemplate size={14} className="text-red-400" />
            Embed Parameters
          </span>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Target Channel</label>
            <select
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-red-500/50"
            >
              <option value="#announcements">#announcements</option>
              <option value="#welcome">#welcome</option>
              <option value="#lounge">#lounge</option>
              <option value="#rules">#rules</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Embed Title</label>
            <input
              type="text"
              value={embedTitle}
              onChange={(e) => setEmbedTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Embed Description</label>
            <textarea
              rows={3}
              value={embedDesc}
              onChange={(e) => setEmbedDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Palette size={13} className="text-red-400" />
              Accent Color (HEX)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={embedColor}
                onChange={(e) => setEmbedColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer"
              />
              <input
                type="text"
                value={embedColor}
                onChange={(e) => setEmbedColor(e.target.value)}
                className="w-32 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDispatch}
            className="mt-2 w-full py-3 rounded-2xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] text-white font-bold text-xs shadow-[0_0_20px_rgba(225,29,46,0.35)] hover:shadow-[0_0_35px_rgba(225,29,46,0.7)] border border-red-400/30 transition-all flex items-center justify-center gap-2"
          >
            <Send size={14} />
            <span>Dispatch to Discord</span>
          </button>
        </div>

        {/* Live Discord Preview Card */}
        <div className="p-6 rounded-3xl bg-[#090b10] border border-white/10 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles size={14} className="text-red-400" />
              Live Discord Client Preview
            </span>

            {/* Discord Embed Box */}
            <div
              className="rounded-xl p-4 bg-[#1e1f22] border-l-4 shadow-xl flex flex-col gap-2"
              style={{ borderLeftColor: embedColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                  R
                </div>
                <span className="text-xs font-bold text-white">RNG Network Bot</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#5865F2] text-white font-bold font-mono">
                  BOT
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{embedTitle || 'Untitled Embed'}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {embedDesc || 'No content provided.'}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>RNG Administration Gateway</span>
                <span>Today at 12:00 PM</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400 font-mono">
            Target Destination: <span className="text-white font-semibold">{targetChannel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
