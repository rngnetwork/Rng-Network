"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

export default function ServerEmbedsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_20px_rgba(225,29,46,0.3)]">
        <Info size={24} />
      </div>

      <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-semibold mb-2">
        Next Feature
      </span>

      <h2 className="text-lg font-bold text-white mb-1">
        Embed Builder
      </h2>

      <p className="text-xs text-zinc-400">
        Part of next build phase.
      </p>
    </motion.div>
  );
}
