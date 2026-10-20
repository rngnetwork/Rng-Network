'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PARTICLES = Array.from({ length: 32 }).map((_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  y: (i * 23 + 7) % 100,
  size: (i % 3) + 1.5,
  duration: 12 + (i % 8),
  delay: (i % 5) * 0.8,
}));

export const AuthBackgroundEffects: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-surface-canvas z-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{ backgroundImage: 'url("/assets/apocalyptic_battlefield_bg.jpg")' }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-screen"
        style={{ backgroundImage: 'url("/assets/RNG_Bannerr.gif")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-canvas via-transparent to-surface-canvas/85" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-red/10 via-transparent to-brand-red/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#09090B_100%)] opacity-90" />

      <div className="absolute inset-0 z-10">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-brand-red rounded-full shadow-glow"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: ['0%', '-1800%'],
              opacity: [0, 0.9, 0],
              x: p.x % 2 === 0 ? ['0%', '80%'] : ['0%', '-80%'],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
};
