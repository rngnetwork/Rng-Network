import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AccountPageCoordinator } from '../AccountPageCoordinator';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import * as accountApi from '@/lib/api/dashboard/account';
import * as whitelistApi from '@/lib/api/dashboard/whitelist';
import * as permsApi from '@/lib/api/dashboard/personnel/perms';

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-token'),
}));

vi.mock('@/lib/api/dashboard/account', () => ({
  fetchUserProfile: vi.fn(),
  fetchActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/whitelist', () => ({
  fetchPersonnelHierarchy: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/personnel/perms', () => ({
  fetchPreviewRoleOptions: vi.fn(),
}));

describe('AccountPageCoordinator Role Preview visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'mock-token');
    vi.mocked(accountApi.fetchUserProfile).mockResolvedValue({
      success: true,
      data: {
        id: 50,
        email: 'director@rng.gg',
        fullName: 'Director R7',
        role: 'ROLE_USER',
        designations: 'Security Ops',
        roles: 'Security Ops:Custom R7',
        designationList: ['Security Ops'],
        roleList: ['Security Ops:Custom R7'],
        discordLinked: true,
      },
    });
    vi.mocked(whitelistApi.fetchPersonnelHierarchy).mockResolvedValue({
      success: true,
      data: { 'Security Ops': ['Custom R7'] },
    });
    vi.mocked(accountApi.fetchActiveSessions).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(permsApi.fetchPreviewRoleOptions).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('completely hides Role Preview card and its grid wrapper on dashboard/account for R7-R0 users', async () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 7,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: () => true,
      hasServerPermission: () => false,
      isRouteAllowed: () => true,
    });

    const { container } = render(<AccountPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Account Profile')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Role Visibility Preview/i)).not.toBeInTheDocument();
    expect(permsApi.fetchPreviewRoleOptions).not.toHaveBeenCalled();
    expect(container.querySelector('.lg\\:col-span-2')).toBeNull();
  });

  it('renders Role Preview card on dashboard/account for R8/R9 users', async () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 8,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: () => true,
      hasServerPermission: () => false,
      isRouteAllowed: () => true,
    });

    render(<AccountPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText(/Role Visibility Preview/i)).toBeInTheDocument();
    });
    expect(permsApi.fetchPreviewRoleOptions).toHaveBeenCalledTimes(1);
  });
});
