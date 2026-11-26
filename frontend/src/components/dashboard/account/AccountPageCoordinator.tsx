'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { fetchUserProfile, fetchActiveSessions, revokeSession } from '@/lib/api/dashboard/account';
import { fetchPersonnelHierarchy } from '@/lib/api/dashboard/whitelist';
import type { UserProfileData, ActiveSessionItem } from '@/lib/model/user';
import type { PersonnelHierarchyMap } from '@/lib/model/whitelist';
import { Badge } from '@/components/common/feedback/Badge';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import { AccountProfileDetails } from './AccountProfileDetails';
import { PersonnelClearanceCard } from './PersonnelClearanceCard';
import { RolePreviewTogglerCard } from './RolePreviewTogglerCard';
import { ActiveSessionsList } from './ActiveSessionsList';

export const AccountPageCoordinator: React.FC = () => {
  const { callerMaxRankWeight } = useEffectivePermissions();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [hierarchy, setHierarchy] = useState<PersonnelHierarchyMap>({});
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [profileRes, hierRes, sessionsRes] = await Promise.allSettled([
          fetchUserProfile(token),
          fetchPersonnelHierarchy(token),
          fetchActiveSessions(token),
        ]);

        if (isMounted) {
          if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.data) {
            setUser(profileRes.value.data);
          }
          if (hierRes.status === 'fulfilled' && hierRes.value.success && hierRes.value.data) {
            setHierarchy(hierRes.value.data);
          }
          if (
            sessionsRes.status === 'fulfilled' &&
            sessionsRes.value.success &&
            Array.isArray(sessionsRes.value.data)
          ) {
            setSessions(sessionsRes.value.data);
          }
        }
      } catch {
        // Handled by global session interceptor
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setRevokingId(sessionId);
    try {
      const res = await revokeSession(sessionId, token);
      if (res.success) {
        setSessions((prev) => prev.filter((item) => item.id !== sessionId));
      }
    } catch {
      // Handled by error toast
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Loading Personnel Clearance..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 rounded-apple-xl bg-zinc-900/70 border border-white/10 text-center">
        <p className="text-zinc-400">Could not retrieve account details. Please sign in again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Account Profile
            </h1>
            <p className="text-xs md:text-sm text-zinc-400">
              Manage identity, ministry clearance, and Discord 2FA credentials
            </p>
          </div>
        </div>

        <Badge variant="success">Active Session</Badge>
      </div>

      <AccountProfileDetails user={user} rankWeight={callerMaxRankWeight} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonnelClearanceCard user={user} hierarchy={hierarchy} />
        <ActiveSessionsList
          sessions={sessions}
          onRevokeSession={(id) => void handleRevokeSession(id)}
          revokingId={revokingId}
        />
        <div className="lg:col-span-2">
          <RolePreviewTogglerCard />
        </div>
      </div>
    </div>
  );
};
