"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AnimatedGradient } from '../background/AnimatedGradient';
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
      className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 text-center"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bg-gradient-slow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-bg-gradient-slow {
          background-size: 200% auto;
          animation: bg-gradient-slow 8s linear infinite;
        }
        .neon-red-outline-glow {
          filter: drop-shadow(0 0 2px #ff0033)
                 drop-shadow(0 0 5px #ff0033)
                 drop-shadow(0 0 8px rgba(255, 0, 51, 0.9))
                 drop-shadow(0 0 12px rgba(255, 0, 51, 0.65));
        }
      `}} />
      <AnimatedGradient />

      {type === "main" ? (
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 15 }}
             className="w-36 h-36 mb-6 relative flex items-center justify-center neon-red-outline-glow"
           >
             <div className="relative w-full h-full">
               <Image priority src="/visuals/RNG_MAIN_LOGO_TRANSPARENT.png" alt="RNG Logo" fill unoptimized className="object-contain" />
             </div>
           </motion.div>
           
           <h1 className="text-3xl font-extrabold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] via-[#8b0000] to-[#ff3333] drop-shadow-md relative mb-3 leading-tight uppercase animate-bg-gradient-slow">
             RNG<br/>Administration
           </h1>
           <div className="h-[2px] w-12 bg-[#E11D2E] rounded-full shadow-[0_0_10px_rgba(225,29,46,0.8)] mt-2" />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 15 }}
             className="w-32 h-32 mb-6 relative flex items-center justify-center neon-red-outline-glow"
           >
             <div className="relative w-full h-full">
               <Image priority src="/visuals/staff.png" alt="Login Icon" fill unoptimized className="object-contain" />
             </div>
           </motion.div>
           
           <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
             Network Login
           </h2>
           <p className="text-white/60 text-[14px] font-medium max-w-[240px]">
             Sign in to access the administration portal.
           </p>
           
           <div className="mt-8 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-[0_0_20px_rgba(225,29,46,0.2)]">
             Secured Gateway
           </div>
        </div>
      )}
    </motion.div>
  );
}
