import React from 'react';
import { Sidebar } from '@/components/ui/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#090909] overflow-hidden text-white font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Cinematic Dashboard Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E11D2E]/5 via-[#090909]/0 to-[#090909]/0 pointer-events-none" />
        <div className="relative z-10 h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
