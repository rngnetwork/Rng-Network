'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Settings, Bot, FileCode, LineChart } from 'lucide-react';
import { TabStrip, type TabItem } from '@/components/common';

export interface ServerNavigationTabStripProps {
  serverId: string;
  className?: string;
}

export const ServerNavigationTabStrip: React.FC<ServerNavigationTabStripProps> = ({
  serverId,
  className = '',
}) => {
  const pathname = usePathname();

  const tabs: TabItem[] = [
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

  const activeTab =
    pathname === `/dashboard/servers/${serverId}`
      ? 'settings'
      : tabs.find((t) => t.href === pathname)?.id;

  return (
    <TabStrip
      tabs={tabs}
      activeTab={activeTab}
      layoutId="serverActiveTabIndicator"
      ariaLabel="Server workspace tabs"
      className={className}
    />
  );
};
