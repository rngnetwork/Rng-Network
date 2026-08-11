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

      {/* MOBILE LAYOUT: Simple Login Card */}
      <div className="flex md:hidden w-full rounded-3xl shadow-2xl relative overflow-hidden border border-slate-200/60 bg-white">
        <LoginPanel mode="login" onBack={() => {}} />
      </div>
    </>
  );
}
