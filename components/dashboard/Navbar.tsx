"use client";

import React from 'react';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { UserProfileData } from '@/lib/api';

interface NavbarProps {
  user?: UserProfileData | null;
}

export function Navbar({}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 px-6 md:px-8 border-b border-white/10 bg-[#080808]/70 backdrop-blur-xl flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-white tracking-wide">
          RNG Administrative Centre
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <UserProfileDropdown />
      </div>
    </header>
  );
}
