'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowUpRight, Zap } from 'lucide-react';
import type { CyberNode } from './cyberWebData';

export interface CyberNodeCardProps {
  node: CyberNode;
  onNavigate: (route: string) => void;
}

export const CyberNodeCard: React.FC<CyberNodeCardProps> = ({ node, onNavigate }) => {
  const Icon = node.icon;
  const isActive = node.status === 'active';

  const handleClick = () => {
    if (isActive && node.route) {
      onNavigate(node.route);
    }
  };

  return (
    <motion.div
      whileHover={isActive ? { scale: 1.04, y: -4 } : undefined}
      whileTap={isActive ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={handleClick}
      role={isActive ? 'button' : undefined}
      tabIndex={isActive ? 0 : undefined}
      onKeyDown={
        isActive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      className={`group relative rounded-apple-xl p-5 transition-all duration-300 select-none flex flex-col justify-between overflow-hidden backdrop-blur-xl border ${
        isActive
          ? 'bg-[#0E0E14]/90 border-brand-red/60 hover:border-brand-red cursor-pointer'
          : 'bg-[#0B0C0E]/70 border-white/[0.07] opacity-65 hover:opacity-85 cursor-not-allowed'
      }`}
      style={
        isActive
          ? {
              filter:
                'drop-shadow(0 0 16px rgba(225, 29, 46, 0.65)) drop-shadow(0 0 32px rgba(225, 29, 46, 0.25))',
            }
          : undefined
      }
    >
      {/* Corner Cyber Edge Accents */}
      <div
        className={`absolute top-0 right-0 w-8 h-8 pointer-events-none transition-opacity ${
          isActive
            ? 'border-t-2 border-r-2 border-brand-red/80 rounded-tr-apple-xl'
            : 'border-t border-r border-white/10 rounded-tr-apple-xl'
        }`}
      />
      <div
        className={`absolute bottom-0 left-0 w-8 h-8 pointer-events-none transition-opacity ${
          isActive
            ? 'border-b-2 border-l-2 border-brand-red/80 rounded-bl-apple-xl'
            : 'border-b border-l border-white/10 rounded-bl-apple-xl'
        }`}
      />

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-apple-md flex items-center justify-center relative shrink-0 transition-transform duration-200 ${
              isActive
                ? 'bg-brand-red/15 text-brand-red border border-brand-red/40 group-hover:scale-105 shadow-glow'
                : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06]'
            }`}
          >
            <Icon size={20} />
            {isActive && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red shadow-glow" />
              </span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span
              className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${
                isActive ? 'text-brand-red' : 'text-zinc-500'
              }`}
            >
              {node.clearanceLevel}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono text-zinc-400">
                {isActive ? 'ID: RNG-ACT' : 'ID: RNG-LCK'}
              </span>
            </div>
          </div>
        </div>

        <div>
          {isActive ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red text-[11px] font-mono font-bold tracking-wider group-hover:bg-brand-red group-hover:text-white transition-colors">
              <Zap size={11} className="animate-pulse" />
              <span>ACTIVE</span>
              <ArrowUpRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-500 text-[11px] font-mono font-medium">
              <Lock size={11} />
              <span>LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="my-2">
        <h3
          className={`text-base font-bold tracking-tight mb-1 transition-colors ${
            isActive ? 'text-white group-hover:text-brand-red' : 'text-zinc-400'
          }`}
        >
          {node.name}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
          {node.subtitle}
        </p>
      </div>

      {/* Tags Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {node.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isActive
                  ? 'bg-brand-red/10 text-zinc-300 border border-brand-red/20'
                  : 'bg-white/[0.03] text-zinc-500 border border-white/[0.04]'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {isActive && (
          <span className="text-[10px] font-mono text-brand-red font-semibold shrink-0 group-hover:underline">
            Launch &#8594;
          </span>
        )}
      </div>
    </motion.div>
  );
};
