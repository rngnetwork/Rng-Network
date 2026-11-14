'use client';

import React from 'react';
import { Layers, KeyRound } from 'lucide-react';
import { TabStrip, TabItem } from '@/components/common';

const PERSONNEL_TABS: TabItem[] = [
  {
    id: 'roles',
    label: 'Role Hierarchy',
    href: '/dashboard/personnel/roles',
    icon: Layers,
  },
  {
    id: 'perms',
    label: 'Permission Management',
    href: '/dashboard/personnel/perms',
    icon: KeyRound,
  },
];

export interface PersonnelNavigationTabStripProps {
  className?: string;
}

export const PersonnelNavigationTabStrip: React.FC<PersonnelNavigationTabStripProps> = ({
  className = '',
}) => {
  return (
    <TabStrip
      tabs={PERSONNEL_TABS}
      layoutId="personnelActiveTabIndicator"
      ariaLabel="Personnel workspace tabs"
      className={className}
    />
  );
};
