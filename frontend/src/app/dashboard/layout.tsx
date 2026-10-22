import React from 'react';
import type { Metadata } from 'next';
import { DashboardShellClient } from '@/components/dashboard/layout/DashboardShellClient';

export const metadata: Metadata = {
  title: 'Dashboard — RNG Control Center',
  description: 'Autonomous Discord management and telemetry command center.',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShellClient>{children}</DashboardShellClient>;
}
