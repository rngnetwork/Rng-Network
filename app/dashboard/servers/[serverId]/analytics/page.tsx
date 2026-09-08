"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

export default function ServerAnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-[0_0_20px_rgba(225,29,46,0.3)]">
        <Info size={22} />
      </div>

      <h2 className="text-base font-bold text-white tracking-wide">
        Next feature
      </h2>
    </motion.div>
  );
}
