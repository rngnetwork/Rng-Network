"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedGradient } from '../background/AnimatedGradient';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { LoginRole } from './AuthShell';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function BrandingPanel({ type }: { type: "main" | LoginRole }) {
  return (
    <motion.div 
      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
    >
      <AnimatedGradient />

      {type === "main" ? (
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="w-24 h-24 mb-8"
           >
             <img src="/visuals/LOGO_FOR_STAFFS.png" alt="RNG Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(225,29,46,0.6)]" />
           </motion.div>
           
           <h1 className="text-3xl font-extrabold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-lg relative mb-3 leading-tight uppercase">
             RNG<br/>Administration
           </h1>
           <div className="h-[2px] w-12 bg-[#E11D2E] rounded-full shadow-[0_0_10px_rgba(225,29,46,0.8)] mt-2" />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
             className="w-20 h-20 mb-6 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
           >
             {type === 'owner' && <ShieldAlert size={36} className="text-[#E11D2E] drop-shadow-[0_0_15px_rgba(225,29,46,0.8)]" />}
             {type === 'manager' && <ShieldCheck size={36} className="text-[#E11D2E] drop-shadow-[0_0_15px_rgba(225,29,46,0.8)]" />}
             {type === 'staff' && <Shield size={36} className="text-[#E11D2E] drop-shadow-[0_0_15px_rgba(225,29,46,0.8)]" />}
           </motion.div>
           
           <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Login as {type?.charAt(0).toUpperCase()}{type?.slice(1)}</h2>
           <p className="text-white/60 text-[14px] font-medium max-w-[240px]">
             Sign in to access the {type} administration portal.
           </p>
           
           <div className="mt-8 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(225,29,46,0.2)]">
             {type} Access
           </div>
        </div>
      )}
    </motion.div>
  );
}
