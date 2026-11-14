'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchCurrentUser } from '@/lib/api/auth/session';
import type { UserProfileData } from '@/lib/model/user';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';

export const PersonnelPageCoordinator: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const isChiefHighCommand = useMemo(() => {
    const hasChiefRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'chief high command';
      }) || currentUser?.roles?.toLowerCase().includes('chief high command');
    return Boolean(currentUser?.role === 'ROLE_CHIEF_HIGH_COMMAND' || hasChiefRole);
  }, [currentUser]);

  const isHighCommand = useMemo(() => {
    if (isChiefHighCommand) return true;
    const hasHcRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command' || pure.toLowerCase() === 'chief high command';
      }) || currentUser?.roles?.toLowerCase().includes('high command');
    return Boolean(
      currentUser?.role === 'ROLE_HIGH_COMMAND' ||
        currentUser?.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
        hasHcRole
    );
  }, [currentUser, isChiefHighCommand]);

  const isMinister = useMemo(() => {
    if (isHighCommand) return false;
    const hasMinisterRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'minister';
      }) || currentUser?.roles?.toLowerCase().includes('minister');
    return Boolean(currentUser?.role === 'ROLE_MINISTER' || hasMinisterRole);
  }, [currentUser, isHighCommand]);

  const ministerMinistries = useMemo(() => {
    if (!isMinister || !currentUser) return [];
    const list = currentUser.designationList || [];
    return list.filter((d) => d.startsWith('Ministry of'));
  }, [isMinister, currentUser]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await fetchCurrentUser(token);
        if (isMounted && res.success && res.data) {
          setCurrentUser(res.data);
        }
      } catch {
        // Handled gracefully in offline/unauthenticated state
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Loading Personnel Deck..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Personnel
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              {isHighCommand
                ? 'Manage system-wide personnel credentials, designations, and permissions.'
                : `Scoped access: Manage personnel strictly within ${
                    ministerMinistries.join(' & ') || 'your assigned ministries'
                  }.`}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 min-h-0 flex flex-col gap-6" />
    </div>
  );
};
