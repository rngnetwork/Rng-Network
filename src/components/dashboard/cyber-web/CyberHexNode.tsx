'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { CyberNode } from './cyberWebData';

export interface CyberHexNodeProps {
  node: CyberNode;
  onNavigate: (route: string) => void;
}

export const CyberHexNode: React.FC<CyberHexNodeProps> = ({ node, onNavigate }) => {
  const isActive = node.status === 'active';
  const Icon = node.icon;

  const handleClick = () => {
    if (isActive && node.route) {
      onNavigate(node.route);
    }
  };

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none z-10"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={!isActive}
        whileHover={isActive ? { scale: 1.15 } : {}}
        whileTap={isActive ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        aria-label={node.name}
        className={`relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center focus:outline-none transition-all duration-300 ${
          isActive
            ? 'cursor-pointer group'
            : 'cursor-not-allowed opacity-60'
        }`}
      >
        {/* SVG Hexagonal Frame */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            isActive
              ? 'drop-shadow-[0_0_12px_rgba(225,29,46,0.95)] drop-shadow-[0_0_24px_rgba(225,29,46,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(225,29,46,1)] group-hover:drop-shadow-[0_0_40px_rgba(225,29,46,0.8)]'
              : ''
          }`}
        >
          {/* Outer Hexagon */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            className={`transition-all duration-300 ${
              isActive
                ? 'fill-[#090A10]/90 stroke-[#E11D2E] stroke-[2.5] group-hover:stroke-[#FF3B4E]'
                : 'fill-[#0A0A0E]/80 stroke-zinc-700/60 stroke-[1.5]'
            }`}
          />

          {/* Inner Hexagon Detail Ring */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            className={`transition-all duration-300 ${
              isActive
                ? 'fill-transparent stroke-[#E11D2E]/30 stroke-[1] group-hover:stroke-[#E11D2E]/60'
                : 'fill-transparent stroke-zinc-800/40 stroke-[0.8]'
            }`}
          />
        </svg>

        {/* Pulsing Core Aura for Active Nodes */}
        {isActive && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full bg-[#E11D2E]/25 blur-md animate-pulse" />
          </span>
        )}

        {/* Center Node Icon & Core Dot */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1">
          <Icon
            size={22}
            className={`transition-colors duration-200 ${
              isActive
                ? 'text-white group-hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : 'text-zinc-600'
            }`}
          />
          {isActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D2E] shadow-[0_0_6px_#E11D2E] animate-ping" />
          ) : (
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
          )}
        </div>
      </motion.button>

      {/* Clean Minimalist Node Title */}
      <div className="mt-2 text-center pointer-events-none max-w-[140px]">
        <span
          className={`block text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-200 leading-tight ${
            isActive
              ? 'text-white drop-shadow-[0_0_10px_rgba(225,29,46,0.5)]'
              : 'text-zinc-500 font-mono text-[11px]'
          }`}
        >
          {node.name}
        </span>
      </div>
    </motion.div>
  );
};
