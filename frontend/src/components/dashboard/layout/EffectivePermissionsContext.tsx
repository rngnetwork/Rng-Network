'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredPreviewRoleId,
  getStoredAccessToken,
  getStoredPreviewRoleId,
  setStoredPreviewRoleId,
} from '@/lib/api/core/client';
import { fetchMyEffectivePermissions } from '@/lib/api/dashboard/personnel/perms';
import type { EffectivePermissions } from '@/lib/model/personnel/perms';

export interface EffectivePermissionsContextValue {
  effectivePermissions: EffectivePermissions | null;
  loading: boolean;
  isPreviewMode: boolean;
  previewRoleId: string | null;
  previewRoleName: string | null;
  callerMaxRankWeight: number;
  refreshPermissions: (overridePreviewRoleId?: string | null) => Promise<void>;
  enterPreviewMode: (roleId: string) => Promise<void>;
  exitPreviewMode: () => Promise<void>;
  hasPermission: (...path: string[]) => boolean;
  hasServerPermission: (serverSlugOrId: string, subFeature?: string) => boolean;
  isRouteAllowed: (pathname: string) => boolean;
}

const EffectivePermissionsContext = createContext<EffectivePermissionsContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const EffectivePermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async (overridePreviewRoleId?: string | null) => {
    const token = getStoredAccessToken();
    if (!token) {
      setEffectivePermissions(null);
      setLoading(false);
      return;
    }

    const activePreviewId =
      overridePreviewRoleId !== undefined ? overridePreviewRoleId : getStoredPreviewRoleId();

    try {
      const res = await fetchMyEffectivePermissions(activePreviewId, token);
      if (res?.success && res.data) {
        setEffectivePermissions(res.data);
      } else {
        setEffectivePermissions(null);
      }
    } catch {
      if (activePreviewId) {
        clearStoredPreviewRoleId();
        try {
          const fallbackRes = await fetchMyEffectivePermissions(null, token);
          if (fallbackRes?.success && fallbackRes.data) {
            setEffectivePermissions(fallbackRes.data);
            return;
          }
        } catch {
          // Leave null on unrecoverable failure
        }
      }
      setEffectivePermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        return refreshPermissions();
      }
      return undefined;
    });
    return () => {
      active = false;
    };
  }, [refreshPermissions]);

  useEffect(() => {
    const handlePermsUpdated = () => {
      void refreshPermissions();
    };
    const handlePreviewCleared = () => {
      void refreshPermissions(null);
    };
    const handleSessionExpired = () => {
      clearStoredPreviewRoleId();
      setEffectivePermissions(null);
    };

    window.addEventListener('rng:permissions-updated', handlePermsUpdated);
    window.addEventListener('rng:preview-role-cleared', handlePreviewCleared);
    window.addEventListener('rng:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('rng:permissions-updated', handlePermsUpdated);
      window.removeEventListener('rng:preview-role-cleared', handlePreviewCleared);
      window.removeEventListener('rng:session-expired', handleSessionExpired);
    };
  }, [refreshPermissions]);

  const enterPreviewMode = useCallback(
    async (roleId: string) => {
      setStoredPreviewRoleId(roleId);
      setLoading(true);
      await refreshPermissions(roleId);
    },
    [refreshPermissions]
  );

  const exitPreviewMode = useCallback(async () => {
    clearStoredPreviewRoleId();
    setLoading(true);
    await refreshPermissions(null);
  }, [refreshPermissions]);

  const hasPermission = useCallback(
    (...path: string[]): boolean => {
      if (!effectivePermissions?.permissions || path.length === 0) {
        return false;
      }
      let startIndex = 0;
      if (path[0] === 'dashboard' && path.length > 1) {
        const dashboardNode = effectivePermissions.permissions['dashboard'];
        if (!isRecord(dashboardNode) || dashboardNode.enabled !== true) {
          return false;
        }
        startIndex = 1;
      }
      let current: Record<string, unknown> = effectivePermissions.permissions;
      for (let i = startIndex; i < path.length; i++) {
        const next = current[path[i]];
        if (!isRecord(next) || next.enabled !== true) {
          return false;
        }
        current = next;
      }
      return true;
    },
    [effectivePermissions]
  );

  const hasServerPermission = useCallback(
    (serverSlugOrId: string, subFeature?: string): boolean => {
      if (!hasPermission('dashboard', 'dashboard.servers') || !serverSlugOrId) {
        return false;
      }
      const serversSection = effectivePermissions?.permissions?.['dashboard.servers'];
      if (!isRecord(serversSection)) {
        return false;
      }
      const collection = serversSection['dashboard.servers.[serverId]'];
      if (!isRecord(collection)) {
        return true;
      }
      const serverNode = collection[serverSlugOrId];
      if (!isRecord(serverNode)) {
        return true;
      }
      if (serverNode.enabled !== true) {
        return false;
      }
      if (!subFeature) {
        return true;
      }
      const subVal = serverNode[subFeature];
      if (typeof subVal === 'boolean') {
        return subVal;
      }
      if (isRecord(subVal)) {
        return subVal.enabled === true;
      }
      return false;
    },
    [effectivePermissions, hasPermission]
  );

  const isRouteAllowed = useCallback(
    (pathname: string): boolean => {
      const cleanPath = (pathname || '/dashboard').split('?')[0].replace(/\/+$/, '') || '/dashboard';

      if (cleanPath === '/dashboard') {
        return hasPermission('dashboard');
      }
      if (cleanPath.startsWith('/dashboard/account')) {
        return hasPermission('dashboard', 'dashboard.account');
      }
      if (cleanPath === '/dashboard/servers') {
        return hasPermission('dashboard', 'dashboard.servers');
      }
      if (cleanPath.startsWith('/dashboard/servers/')) {
        const remainder = cleanPath.slice('/dashboard/servers/'.length);
        const [serverSlug, subSegment] = remainder.split('/');
        if (!serverSlug) {
          return hasPermission('dashboard', 'dashboard.servers');
        }
        const subFeature =
          subSegment === 'settings' ||
          subSegment === 'botconfig' ||
          subSegment === 'embeds' ||
          subSegment === 'analytics'
            ? subSegment
            : undefined;
        return hasServerPermission(serverSlug, subFeature);
      }
      if (cleanPath.startsWith('/dashboard/embeds')) {
        return hasPermission('dashboard', 'dashboard.embeds');
      }
      if (cleanPath.startsWith('/dashboard/botconfig')) {
        return hasPermission('dashboard', 'dashboard.botconfig');
      }
      if (cleanPath.startsWith('/dashboard/whitelist')) {
        return hasPermission('dashboard', 'dashboard.whitelist');
      }
      if (cleanPath === '/dashboard/personnel') {
        return (
          hasPermission('dashboard', 'dashboard.personnel') &&
          (hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.roles') ||
            hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.perms'))
        );
      }
      if (cleanPath.startsWith('/dashboard/personnel/roles')) {
        return hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.roles');
      }
      if (cleanPath.startsWith('/dashboard/personnel/perms')) {
        return hasPermission('dashboard', 'dashboard.personnel', 'dashboard.personnel.perms');
      }

      return hasPermission('dashboard');
    },
    [hasPermission, hasServerPermission]
  );

  const value = useMemo<EffectivePermissionsContextValue>(
    () => ({
      effectivePermissions,
      loading,
      isPreviewMode: Boolean(effectivePermissions?.isPreviewMode),
      previewRoleId: effectivePermissions?.previewRoleId ?? null,
      previewRoleName: effectivePermissions?.previewRoleName ?? null,
      callerMaxRankWeight: effectivePermissions?.callerMaxRankWeight ?? 0,
      refreshPermissions,
      enterPreviewMode,
      exitPreviewMode,
      hasPermission,
      hasServerPermission,
      isRouteAllowed,
    }),
    [
      effectivePermissions,
      loading,
      refreshPermissions,
      enterPreviewMode,
      exitPreviewMode,
      hasPermission,
      hasServerPermission,
      isRouteAllowed,
    ]
  );

  return (
    <EffectivePermissionsContext.Provider value={value}>
      {children}
    </EffectivePermissionsContext.Provider>
  );
};

export function useEffectivePermissions(): EffectivePermissionsContextValue {
  const ctx = useContext(EffectivePermissionsContext);
  if (!ctx) {
    throw new Error('useEffectivePermissions must be used within EffectivePermissionsProvider');
  }
  return ctx;
}
