"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto h-full flex flex-col"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Overview</h1>
        <p className="text-[#A0A0A0]">Welcome to your infrastructure control center.</p>
      </header>

      {/* Placeholder Grid for Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="h-10 w-10 bg-white/5 rounded-xl mb-4" />
             <div className="text-3xl font-bold text-white mb-1">---</div>
             <div className="text-sm text-[#A0A0A0]">Loading Metric...</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E11D2E] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />
         <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
         
         <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
           <p className="text-[#555] text-sm">No activity logs found from backend.</p>
         </div>
      </div>
    </motion.div>
  );
}
