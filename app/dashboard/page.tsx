"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }

    const checkDestination = async () => {
      try {
        const userRes = await api.fetchCurrentUser(token);
        if (userRes.success && userRes.data) {
          const isPrivileged =
            userRes.data.role === 'ROLE_HIGH_COMMAND' ||
            userRes.data.roles?.includes('High Command') ||
            userRes.data.roles?.includes('Minister') ||
            userRes.data.role === 'ROLE_MINISTER';

          if (isPrivileged) {
            router.replace('/dashboard/whitelist');
          } else {
            router.replace('/dashboard/account');
          }
          return;
        }
      } catch {
        // Token invalid
      }
      router.replace('/dashboard/whitelist');
    };

    checkDestination();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
    </div>
  );
}
