import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, KeyRound, UserCheck } from 'lucide-react';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

const PORTAL_OPTIONS: DropdownOption<'login' | 'register'>[] = [
  {
    value: 'login',
    label: 'Command Portal (RAC Login)',
    description: 'Access RNG Autonomous Command Control',
    icon: <KeyRound size={16} className="text-red-500" />
  },
  {
    value: 'register',
    label: 'Personnel Enrollment',
    description: 'Initial Identity Assertion & Registration',
    icon: <UserCheck size={16} className="text-indigo-400" />
  }
];

export function RoleSelector({ onSelect }: { onSelect: (role: 'login' | 'register') => void }) {
  const [selectedPortal, setSelectedPortal] = useState<'login' | 'register'>('login');

  return (
    <motion.div 
      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full h-full min-h-[450px] flex-1 flex flex-col justify-center p-6 md:p-12 bg-white relative"
    >
      <div className="mb-2">
        <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Secure Administration Portal</span>
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
      <p className="text-slate-500 text-[14px] mb-6 font-medium max-w-[280px]">Choose how you want to continue.</p>

      <div className="flex flex-col gap-4">
        {/* Aesthetic Glassmorphic Dropdown for Portal Selection */}
        <div className="w-full">
          <label className="block mb-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
            Clearance Mode
          </label>
          <GlassmorphicDropdown<'login' | 'register'>
            options={PORTAL_OPTIONS}
            value={selectedPortal}
            onChange={(val) => setSelectedPortal(val)}
            triggerClassName="bg-slate-900 border-slate-700/60 text-white hover:border-red-500/50"
          />
        </div>

        <button
          onClick={() => onSelect(selectedPortal)}
          className="group relative flex items-center justify-between p-5 rounded-2xl border border-slate-700/50 bg-[#121212]/80 hover:bg-[#1A1A1A] hover:border-[#E11D2E]/80 hover:shadow-[0_0_30px_rgba(225,29,46,0.6)] transition-all duration-300 overflow-hidden mt-1 cursor-pointer"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E11D2E] to-[#800F1A] flex items-center justify-center shadow-[0_0_15px_rgba(225,29,46,0.4)] group-hover:shadow-[0_0_25px_rgba(225,29,46,0.7)] transition-all">
              <Shield className="text-white" size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-[17px] mb-1">
                {selectedPortal === 'login' ? 'Sign In to RAC' : 'Enroll as Personnel'}
              </h3>
              <p className="text-slate-400 text-[13px]">
                {selectedPortal === 'login'
                  ? 'Access the RNG Administration Control'
                  : 'Submit credentials for Ministry Whitelist'}
              </p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 group-hover:text-[#E11D2E] transition-colors relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E11D2E]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>
    </motion.div>
  );
}
