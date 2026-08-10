import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function RoleSelector({ onSelect }: { onSelect: (role: 'login' | 'register') => void }) {
  return (
    <motion.div 
      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col justify-center p-12 bg-white"
    >
      <div className="mb-2">
        <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Secure Administration Portal</span>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
      <p className="text-slate-500 text-[14px] mb-10 font-medium max-w-[280px]">Choose how you want to continue.</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => onSelect('login')}
          className="group relative flex items-center justify-between p-5 rounded-2xl border border-slate-700/50 bg-[#121212]/80 hover:bg-[#1A1A1A] hover:border-[#E11D2E]/50 transition-all duration-300 overflow-hidden"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E11D2E] to-[#800F1A] flex items-center justify-center shadow-[0_0_15px_rgba(225,29,46,0.4)] group-hover:shadow-[0_0_25px_rgba(225,29,46,0.7)] transition-all">
              <Shield className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-[17px] mb-1">Sign In to RAC</h3>
              <p className="text-slate-400 text-[13px]">Access the RNG Administration Control</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 group-hover:text-[#E11D2E] transition-colors relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E11D2E]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        <button
          onClick={() => onSelect('register')}
          className="group relative flex items-center justify-between p-5 rounded-2xl border border-slate-700/50 bg-[#121212]/80 hover:bg-[#1A1A1A] hover:border-white/20 transition-all duration-300 overflow-hidden"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-slate-500 transition-all">
              <svg className="text-white w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-[17px] mb-1">Request Access</h3>
              <p className="text-slate-400 text-[13px]">Apply for a network account</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 group-hover:text-white transition-colors relative z-10" />
        </button>
      </div>
    </motion.div>
  );
}
