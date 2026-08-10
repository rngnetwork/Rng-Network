"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthShell } from '@/components/auth/AuthShell';
import { InitialLoader } from '@/components/ui/InitialLoader';

const BackgroundEffects = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }));
    // eslint-disable-next-line
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black z-0">
      {/* Base Apocalyptic Battlefield Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: 'url("/visuals/apocalyptic_battlefield_bg.jpg")' }}
      />
      
      {/* RNG Banner GIF Blend Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-screen"
        style={{ backgroundImage: 'url("/visuals/RNG_Bannerr.gif")' }}
      />
      
      {/* Dark vignette and atmospheric gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#E11D2E]/10 via-transparent to-[#E11D2E]/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_black_100%)] opacity-90" />

      {/* Floating Embers */}
      <div className="absolute inset-0 z-10">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-[#E11D2E] rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              boxShadow: '0 0 10px 2px rgba(225, 29, 46, 0.8)',
            }}
            animate={{
              y: ['0%', '-2000%'],
              opacity: [0, 1, 0],
              x: p.x % 2 === 0 ? ['0%', '100%'] : ['0%', '-100%']
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function LandingAuthPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-[#E11D2E]/30 selection:text-white">
      <InitialLoader />
      <BackgroundEffects />
      <div className="relative z-10 w-full">
        <AuthShell />
      </div>
    </main>
  );
}
