"use client";

import { AuthShell } from '@/components/auth/AuthShell';

export default function LandingAuthPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans selection:bg-[#E11D2E]/30 selection:text-white">
      {/* Dark vignette outer background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-black" />
      <AuthShell />
    </main>
  );
}
