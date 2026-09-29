"use client";

import React from 'react';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { UserProfileData } from '@/lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NavbarProps {
  user?: UserProfileData | null;
  isHeaderCollapsed?: boolean;
  onToggleHeader?: () => void;
}

export function Navbar({
  isHeaderCollapsed = false,
  onToggleHeader
}: NavbarProps) {
  return (
    <header
      className={`sticky top-0 z-30 h-16 px-6 md:px-8 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl flex items-center justify-between transition-all duration-300 ease-in-out shrink-0 relative ${
        isHeaderCollapsed ? '-mt-16' : 'mt-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-white tracking-wide">
          RNG Administrative Centre
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <UserProfileDropdown />
      </div>

      {/* Joint Bottom Edge Center Collapse Tab */}
      {onToggleHeader && (
        <button
          type="button"
          onClick={onToggleHeader}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-50 flex items-center justify-center w-14 h-4.5 bg-[#18181b] hover:bg-red-600 text-zinc-400 hover:text-white border border-t-0 border-white/20 rounded-b-md shadow-2xl transition-colors duration-200 cursor-pointer group"
          title={isHeaderCollapsed ? 'Expand Header' : 'Collapse Header'}
          aria-label={isHeaderCollapsed ? 'Expand Header' : 'Collapse Header'}
        >
          {isHeaderCollapsed ? (
            <ChevronDown size={13} className="transition-transform group-hover:scale-110" />
          ) : (
            <ChevronUp size={13} className="transition-transform group-hover:scale-110" />
          )}
        </button>
      )}
    </header>
  );
}
