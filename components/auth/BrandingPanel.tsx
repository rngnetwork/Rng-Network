"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AnimatedGradient } from '../background/AnimatedGradient';

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -30 : 30 }),
};

export function BrandingPanel() {
  return (
    <motion.div 
      variants={contentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
    >
      <AnimatedGradient />

      <div className="relative z-10 flex flex-col items-center">
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="w-32 h-32 mb-8 bg-white rounded-3xl shadow-[0_25px_40px_-15px_rgba(225,29,46,0.6)] relative overflow-hidden"
         >
           <div className="absolute inset-x-6 -bottom-4 h-8 bg-[#E11D2E] blur-2xl opacity-80 z-0 mix-blend-screen pointer-events-none"></div>
           <Image src="/visuals/MAIN_LOGO.png" alt="RNG Logo" fill unoptimized className="object-cover rounded-3xl relative z-10 drop-shadow-sm" />
         </motion.div>
         
         <h1 className="text-3xl font-extrabold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-[#ff3333] to-[#8b0000] drop-shadow-md relative mb-3 leading-tight uppercase">
           RNG<br/>Administration
         </h1>
         <div className="h-[2px] w-12 bg-[#E11D2E] rounded-full shadow-[0_0_10px_rgba(225,29,46,0.8)] mt-2" />
      </div>
    </motion.div>
  );
}
