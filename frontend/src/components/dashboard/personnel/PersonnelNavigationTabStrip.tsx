'use client';

import React from 'react';
import { Layers, KeyRound } from 'lucide-react';
import { TabStrip, TabItem } from '@/components/common';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';

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
  const { hasPermission } = useEffectivePermissions();

  const visibleTabs = PERSONNEL_TABS.filter((tab) => {
    if (tab.id === 'roles') {
      return hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.roles');
    }
    if (tab.id === 'perms') {
      return hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.perms');
    }
    return true;
  });

  return (
    <TabStrip
      tabs={visibleTabs}
      layoutId="personnelActiveTabIndicator"
      ariaLabel="Personnel workspace tabs"
      className={className}
    />
  );
};
