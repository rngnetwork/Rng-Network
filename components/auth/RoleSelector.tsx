"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';
import { LoginRole } from './AuthShell';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function RoleSelector({ onSelect }: { onSelect: (role: LoginRole) => void }) {
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

      <div className="flex flex-col gap-3">
        <RoleButton 
          title="Manager" 
          subtitle="Access manager dashboard" 
          icon={<ShieldCheck size={20} strokeWidth={2} />} 
          onClick={() => onSelect('manager')} 
        />
        <RoleButton 
          title="Owner" 
          subtitle="Access owner dashboard" 
          icon={<ShieldAlert size={20} strokeWidth={2} />} 
          onClick={() => onSelect('owner')} 
        />
        <RoleButton 
          title="Staff" 
          subtitle="Access staff dashboard" 
          icon={<Shield size={20} strokeWidth={2} />} 
          onClick={() => onSelect('staff')} 
        />
      </div>
    </motion.div>
  );
}

function RoleButton({ title, subtitle, icon, onClick }: { title: string, subtitle: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group relative w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md outline-none text-left"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500 bg-slate-100 text-slate-500 group-hover:bg-[#E11D2E]/10 group-hover:text-[#E11D2E] group-hover:scale-105">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
        <p className="text-slate-500 text-[13px]">{subtitle}</p>
      </div>
      <div className="text-slate-300 group-hover:text-[#E11D2E] transition-colors pr-2 group-hover:translate-x-1 duration-300 transform">
        <ArrowRight size={18} />
      </div>
    </button>
  );
}
