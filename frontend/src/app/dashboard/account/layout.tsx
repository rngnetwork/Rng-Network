import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Profile — RNG Control Center',
  description: 'Manage personnel clearance, Discord 2FA credentials, and active sessions.',
};

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full">{children}</div>;
}
