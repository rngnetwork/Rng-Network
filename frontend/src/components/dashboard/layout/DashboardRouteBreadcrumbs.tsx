'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumbs, BreadcrumbItem } from '@/components/common/navigation/Breadcrumbs';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Control Center',
  servers: 'Servers',
  embeds: 'Embed Builder',
  whitelist: 'Whitelist',
  personnel: 'Personnel',
  account: 'Account Profile',
  settings: 'Settings',
  botconfig: 'Bot Modules',
  analytics: 'Analytics & Audit',
};

export const DashboardRouteBreadcrumbs: React.FC = () => {
  const pathname = usePathname();

  const items: BreadcrumbItem[] = useMemo(() => {
    if (!pathname) {
      return [{ label: 'Control Center' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const isLast = index === segments.length - 1;
      const label = SEGMENT_LABELS[segment] ?? decodeURIComponent(segment);
      return {
        label,
        href: isLast ? undefined : href,
      };
    });
  }, [pathname]);

  return (
    <Breadcrumbs
      items={items}
      className="hidden sm:flex"
    />
  );
};
