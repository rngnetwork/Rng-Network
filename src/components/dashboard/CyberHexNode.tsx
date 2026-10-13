'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { CyberNode } from './cyberWebData';

export interface CyberHexNodeProps {
  node: CyberNode;
  onNavigate: (route: string) => void;
  isDragging?: boolean;
  onRightClickStart?: (e: React.MouseEvent, nodeId: string) => void;
}

export const CyberHexNode: React.FC<CyberHexNodeProps> = ({
  node,
  onNavigate,
  isDragging = false,
  onRightClickStart,
}) => {
  const isActive = node.status === 'active';
  const Icon = node.icon;

  const handleClick = (e: React.MouseEvent) => {
    // Only regular left-click triggers navigation
    if (e.button === 0 && isActive && node.route) {
      onNavigate(node.route);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Right-click drag initiation (button === 2)
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      onRightClickStart?.(e, node.id);
    }
  };

  return (
    // Outer anchor exactly centered at (node.x, node.y) with dimensions equal to the hexagon
    <div
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 select-none ${
        isDragging ? 'z-40 scale-105' : 'z-10'
      }`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
      }}
    >
      {/* Interactive Hexagonal Button Centered on the Node Coordinates */}
      <motion.button
        type="button"
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        whileHover={isActive && !isDragging ? { scale: 1.15 } : {}}
        whileTap={isActive && !isDragging ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        aria-label={node.name}
        className={`relative w-full h-full flex items-center justify-center focus:outline-none transition-all duration-300 ${
          isDragging
            ? 'cursor-grabbing'
            : isActive
              ? 'cursor-pointer group'
              : 'cursor-grab opacity-60'
        }`}
      >
        {/* SVG Hexagonal Frame */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            isActive || isDragging
              ? 'drop-shadow-[0_0_12px_rgba(225,29,46,0.95)] drop-shadow-[0_0_24px_rgba(225,29,46,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(225,29,46,1)] group-hover:drop-shadow-[0_0_40px_rgba(225,29,46,0.8)]'
              : ''
          }`}
        >
          {/* Outer Hexagon */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            className={`transition-all duration-300 ${
              isActive || isDragging
                ? 'fill-[#090A10]/90 stroke-[#E11D2E] stroke-[2.5] group-hover:stroke-[#FF3B4E]'
                : 'fill-[#0A0A0E]/80 stroke-zinc-700/60 stroke-[1.5]'
            }`}
          />

          {/* Inner Hexagon Detail Ring */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            className={`transition-all duration-300 ${
              isActive || isDragging
                ? 'fill-transparent stroke-[#E11D2E]/30 stroke-[1] group-hover:stroke-[#E11D2E]/60'
                : 'fill-transparent stroke-zinc-800/40 stroke-[0.8]'
            }`}
          />
        </svg>

        {/* Pulsing Core Aura for Active / Dragged Nodes */}
        {(isActive || isDragging) && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-10 h-10 rounded-full bg-[#E11D2E]/25 blur-md animate-pulse" />
          </span>
        )}

        {/* Center Node Icon & Core Dot */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <Icon
            size={22}
            className={`transition-colors duration-200 ${
              isActive || isDragging
                ? 'text-white group-hover:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : 'text-zinc-600'
            }`}
          />
          {isActive || isDragging ? (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D2E] shadow-[0_0_6px_#E11D2E] animate-ping" />
          ) : (
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
          )}
        </div>
      </motion.button>

      {/* Clean High-Legibility Cyber Tag Below Hexagon (Doesn't affect hexagon center) */}
      <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 pointer-events-none z-30 flex justify-center whitespace-nowrap">
        <div
          className={`px-2.5 py-1 rounded-full border backdrop-blur-md shadow-lg transition-all duration-200 ${
            isActive || isDragging
              ? 'bg-[#090A10]/90 border-[#E11D2E]/40 shadow-[0_0_12px_rgba(225,29,46,0.25)]'
              : 'bg-[#0C0D12]/85 border-white/10'
          }`}
        >
          <span
            className={`block text-xs sm:text-[12px] font-bold tracking-wide ${
              isActive || isDragging
                ? 'text-white drop-shadow-[0_0_8px_rgba(225,29,46,0.6)]'
                : 'text-zinc-400 font-mono text-[10px] sm:text-[11px]'
            }`}
          >
            {node.name}
          </span>
        </div>
      </div>
    </div>
  );
};
