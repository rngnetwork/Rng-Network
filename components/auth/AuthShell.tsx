"use client";
import React from 'react';
import { BrandingPanel } from './BrandingPanel';
import { LoginPanel } from './LoginPanel';

export function AuthShell() {
  return (
    <div className="w-full max-w-[850px] mx-auto z-20 px-4">
      <div 
        className="w-full h-[480px] bg-white rounded-3xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.12)] overflow-hidden relative flex flex-col md:flex-row border border-slate-200/60"
      >
        {/* Form Side */}
        <div className="w-full md:w-1/2 flex flex-col relative h-full bg-white z-20">
          <div className="absolute inset-y-0 right-0 w-[1px] bg-slate-100 z-30" />
          <LoginPanel />
        </div>

        {/* Branding Side */}
        <div className="w-full md:w-1/2 relative bg-[#0A0A0A] z-10 h-full overflow-hidden flex flex-col items-center justify-center">
          <BrandingPanel />
        </div>
      </div>
    </div>
  );
}
