import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Server Analytics & Audit — RNG Control Center',
  description: 'Telemetry, dispatch metrics, and 30-day interactive component audit logs.',
};

export default function ServerAnalyticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
