import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Permission Management | RNG Control Center',
  description:
    'Organizational hierarchy directory, granular RBAC policies, and role specification editor.',
};

export default function PersonnelPermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
