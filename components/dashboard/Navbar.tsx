"use client";

import React from 'react';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { UserProfileData } from '@/lib/api';
import { PanelLeft, ChevronUp } from 'lucide-react';

interface NavbarProps {
  user?: UserProfileData | null;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isHeaderCollapsed?: boolean;
  onToggleHeader?: () => void;
}

export function Navbar({
  isSidebarCollapsed = false,
  onToggleSidebar,
  onToggleHeader
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 px-6 md:px-8 border-b border-white/10 bg-[#080808]/70 backdrop-blur-xl flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelLeft size={17} className={isSidebarCollapsed ? 'text-red-400' : 'text-zinc-400'} />
          </button>
        )}
        <span className="text-xs font-mono font-bold text-white tracking-wide">
          RNG Administrative Centre
        </span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {onToggleHeader && (
          <button
            type="button"
            onClick={onToggleHeader}
            title="Collapse Header Bar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono"
          >
            <ChevronUp size={16} />
            <span className="hidden sm:inline">Collapse Header</span>
          </button>
        )}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
