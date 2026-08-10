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
             className="w-32 h-32 mb-8 bg-white rounded-3xl p-4 shadow-[0_25px_40px_-15px_rgba(225,29,46,0.6)] relative overflow-hidden"
           >
             <div className="absolute inset-x-6 -bottom-4 h-8 bg-[#E11D2E] blur-2xl opacity-80 z-0 mix-blend-screen pointer-events-none"></div>
             <img src="/visuals/MAIN_LOGO.png" alt="RNG Logo" className="w-full h-full object-cover relative z-10 drop-shadow-sm" />
           </motion.div>
           
           <h1 className="text-3xl font-extrabold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-[#ff3333] to-[#8b0000] drop-shadow-md relative mb-3 leading-tight uppercase">
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
             className="w-28 h-28 mb-6 bg-white rounded-[2rem] p-3 shadow-[0_20px_35px_-12px_rgba(225,29,46,0.6)] relative flex items-center justify-center"
           >
             <div className="absolute inset-x-4 -bottom-3 h-6 bg-[#E11D2E] blur-xl opacity-70 z-0 pointer-events-none mix-blend-screen"></div>
             {type === 'register' && <img src="/visuals/owner.jpg" className="w-full h-full object-cover rounded-xl relative z-10" />}
             {type === 'login' && <img src="/visuals/staff.png" className="w-full h-full object-contain relative z-10" />}
           </motion.div>
           
           <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
             {type === 'register' ? 'Join Network' : 'Network Login'}
           </h2>
           <p className="text-white/60 text-[14px] font-medium max-w-[240px]">
             {type === 'register' ? 'Submit your credentials to request an account.' : 'Sign in to access the administration portal.'}
           </p>
           
           <div className="mt-8 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(225,29,46,0.2)]">
             {type === 'register' ? 'Access Request' : 'Secured Gateway'}
           </div>
        </div>
      )}
    </motion.div>
  );
}
