'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { UserProfileData } from '@/lib/model/user';
import { DashboardRouteBreadcrumbs } from './DashboardRouteBreadcrumbs';
import { UserProfileMenu } from './UserProfileMenu';
import { Navbar, NavItem } from '@/components/common/navigation/Navbar';

export interface DashboardAppHeaderProps {
  user?: UserProfileData | null;
  isHeaderCollapsed?: boolean;
  onToggleHeader?: () => void;
}

export const DashboardAppHeader: React.FC<DashboardAppHeaderProps> = ({
  user = null,
  isHeaderCollapsed = false,
  onToggleHeader,
}) => {
  const navItems: NavItem[] = [
    { label: 'Servers', href: '/dashboard/servers' },
    { label: 'Embed Builder', href: '/dashboard/embeds', badge: 'V2' },
    { label: 'Whitelist', href: '/dashboard/whitelist' },
  ];

  return (
    <div
      className={`sticky top-0 z-30 transition-all duration-300 ease-in-out shrink-0 relative ${
        isHeaderCollapsed ? '-translate-y-full -mb-16' : 'translate-y-0 mb-0'
      }`}
    >
      <Navbar
        brandName="RNG Administrative Centre"
        items={navItems}
        userMenu={
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <DashboardRouteBreadcrumbs />
            </div>
            <UserProfileMenu initialUser={user} />
          </div>
        }
      />

      {onToggleHeader && (
        <button
          type="button"
          onClick={onToggleHeader}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-50 flex items-center justify-center w-14 h-5 bg-zinc-900 hover:bg-brand-red text-zinc-400 hover:text-white border border-t-0 border-white/15 rounded-b-md shadow-apple-card transition-colors duration-200 cursor-pointer group"
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
    </div>
  );
};
