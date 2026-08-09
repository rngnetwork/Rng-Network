"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleSelector } from './RoleSelector';
import { BrandingPanel } from './BrandingPanel';
import { LoginPanel } from './LoginPanel';

export type LoginRole = "manager" | "owner" | "staff" | null;

const panelTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 1,
};

export function AuthShell() {
  const [role, setRole] = useState<LoginRole>(null);
  const [direction, setDirection] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isFlipped = role !== null;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto [perspective:2000px] z-20 px-4">
      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
        animate={{ 
          rotateY: mousePosition.x * 6,
          rotateX: -mousePosition.y * 6,
        }}
        transition={{ 
          rotateY: { type: "spring", stiffness: 100, damping: 30 },
          rotateX: { type: "spring", stiffness: 100, damping: 30 },
        }}
        className="w-full h-[580px] bg-white rounded-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] overflow-hidden relative flex flex-col md:flex-row border border-slate-200/60"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Dynamic Form Side (Left when default, Right when flipped) */}
        <motion.div
          layout
          transition={panelTransition}
          className="w-full md:w-1/2 flex flex-col relative h-full bg-white z-20"
          style={{ order: isFlipped ? 2 : 1 }}
        >
          <div className="absolute inset-y-0 right-0 w-[1px] bg-slate-100 z-30" />
          <AnimatePresence mode="wait" custom={direction}>
            {role === null ? (
              <RoleSelector key="selector" onSelect={(r) => { setDirection(1); setRole(r); }} />
            ) : (
              <LoginPanel key="login" role={role} onBack={() => { setDirection(-1); setRole(null); }} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Branding Side (Right when default, Left when flipped) */}
        <motion.div
          layout
          transition={panelTransition}
          className="w-full md:w-1/2 relative bg-[#0A0A0A] z-10 h-full overflow-hidden flex flex-col items-center justify-center"
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
  );
}
