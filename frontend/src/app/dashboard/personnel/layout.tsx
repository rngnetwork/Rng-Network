import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Personnel | RNG Control Center',
  description: 'Personnel directory and organizational registry.',
};

export default function PersonnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
