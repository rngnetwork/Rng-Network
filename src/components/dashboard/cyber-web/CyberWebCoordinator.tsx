'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CyberWebCanvas } from './CyberWebCanvas';
import { CyberHexNode } from './CyberHexNode';
import { CYBER_NODES } from './cyberWebData';

export const CyberWebCoordinator: React.FC = () => {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] rounded-apple-2xl overflow-hidden border border-white/[0.06] bg-[#030305] flex flex-col justify-between select-none">
      {/* 3D Cybernetic Neural Canvas with Laser Vectors, Photons & Starburst Filaments */}
      <CyberWebCanvas />

      {/* Cyber Grid Subtle Background Texture */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Minimal Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between p-6 sm:p-8 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#E11D2E] shadow-[0_0_8px_#E11D2E] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E11D2E]">
              Command Constellation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Command Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
            Autonomous Discord Operations & Clearance Constellation
          </p>
        </div>

        {/* Minimal Telemetry Pill */}
        <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-full bg-[#E11D2E]/10 border border-[#E11D2E]/30 text-[#E11D2E] text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(225,29,46,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 / 9 SYSTEMS LIVE</span>
          </div>
        </div>
      </div>

      {/* Spatial Constellation Field - Floating Hexagonal Cyber Vertices */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {CYBER_NODES.map((node) => (
            <CyberHexNode key={node.id} node={node} onNavigate={handleNavigate} />
          ))}
        </div>
      </div>

      {/* Subtle Bottom Ambient Gradient */}
      <div className="relative z-0 h-6 pointer-events-none" />
    </div>
  );
};
