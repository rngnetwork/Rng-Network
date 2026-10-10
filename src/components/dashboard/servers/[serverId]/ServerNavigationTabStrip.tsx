'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Bot, FileCode, LineChart } from 'lucide-react';

export interface ServerNavigationTabStripProps {
  serverId: string;
}

export const ServerNavigationTabStrip: React.FC<ServerNavigationTabStripProps> = ({
  serverId,
}) => {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'settings',
      label: 'Server Settings',
      href: `/dashboard/servers/${serverId}/settings`,
      icon: Settings,
    },
    {
      id: 'botconfig',
      label: 'Bot Modules',
      href: `/dashboard/servers/${serverId}/botconfig`,
      icon: Bot,
    },
    {
      id: 'embeds',
      label: 'Embed Builder',
      href: `/dashboard/servers/${serverId}/embeds`,
      icon: FileCode,
    },
    {
      id: 'analytics',
      label: 'Analytics & Audit',
      href: `/dashboard/servers/${serverId}/analytics`,
      icon: LineChart,
    },
  ];

  return (
    <nav
      aria-label="Server workspace tabs"
      className="relative border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto pb-2.5"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.id === 'settings' && pathname === `/dashboard/servers/${serverId}`);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap rounded-apple-md transition-all duration-200 min-h-[44px] ${
              isActive
                ? 'text-white bg-brand-red/10 border border-brand-red/30 shadow-crimson-glow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-brand-red' : 'text-zinc-500'} />
            <span>{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId="serverActiveTabIndicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute -bottom-2.5 left-2 right-2 h-0.5 bg-brand-red"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
