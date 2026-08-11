"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleSelector } from './RoleSelector';
import { BrandingPanel } from './BrandingPanel';
import { LoginPanel } from './LoginPanel';

export type LoginRole = 'login' | 'register' | null;

const panelTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 1,
};

export function AuthShell() {
  const [role, setRole] = useState<LoginRole>(null);
  const [direction, setDirection] = useState(1);
  const isFlipped = role !== null;

  return (
    <>
      {/* DESKTOP LAYOUT: Box Swapping Animation */}
      <div className="hidden md:block w-full max-w-[850px] mx-auto z-20 px-4">
        <motion.div 
          className="w-full h-[480px] bg-white rounded-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] overflow-hidden relative flex flex-row border border-slate-200/60"
        >
          {/* Dynamic Form Side (Left when default, Right when flipped) */}
          <motion.div
            layout
            transition={panelTransition}
            className="w-1/2 flex flex-col relative h-full bg-white z-20 shrink-0"
            style={{ order: isFlipped ? 2 : 1 }}
          >
            <div className="absolute inset-y-0 right-0 w-[1px] bg-slate-100 z-30" />
            <AnimatePresence mode="wait" custom={direction}>
              {role === null ? (
                <RoleSelector key="selector" onSelect={(r) => { setDirection(1); setRole(r); }} />
              ) : (
                <LoginPanel 
                  key="panel"
                  mode={role} 
                  onBack={() => {
                    setDirection(-1);
                    setRole(null);
                  }} 
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Branding Side (Right when default, Left when flipped) */}
          <motion.div
            layout
            transition={panelTransition}
            className="w-1/2 relative bg-[#0A0A0A] z-10 h-full overflow-hidden flex flex-col items-center justify-center shrink-0"
            style={{ order: isFlipped ? 1 : 2 }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              {role === null ? (
                <BrandingPanel key="branding-main" type="main" />
              ) : (
                <BrandingPanel key={`branding-${role}`} type={role} />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* MOBILE LAYOUT: Simple Login with Watermark */}
      <div className="flex md:hidden w-full h-screen absolute inset-0 bg-white flex-col items-center justify-center px-6 overflow-hidden">
        {/* Grey Watermark Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] grayscale pointer-events-none scale-125">
          <img src="/visuals/MAIN_LOGO.png" alt="RNG Watermark" className="w-[80vw] max-w-[400px] object-contain" />
        </div>
        
        {/* Simple Form Container */}
        <div className="w-full max-w-sm relative z-10 bg-white/60 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-[2rem] h-[550px] overflow-hidden">
           <LoginPanel mode="login" onBack={() => {}} />
        </div>
      </div>
    </>
  );
}
