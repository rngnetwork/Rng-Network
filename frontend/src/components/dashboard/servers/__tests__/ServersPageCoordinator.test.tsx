import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ServersPageCoordinator } from '../ServersPageCoordinator';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import * as serversApi from '@/lib/api/dashboard/servers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/servers', () => ({
  fetchUserManagedServers: vi.fn(),
}));

describe('ServersPageCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'test-token');
    vi.mocked(serversApi.fetchUserManagedServers).mockResolvedValue({
      success: true,
      data: [
        {
          id: '111',
          slug: 'server-1',
          name: 'Server 1',
          iconUrl: null,
          bannerUrl: null,
          onlineCount: 10,
          totalCount: 50,
          boostLevel: 1,
          boostCount: 2,
          status: 'ONLINE',
        },
        {
          id: '222',
          slug: 'server-2',
          name: 'Server 2',
          iconUrl: null,
          bannerUrl: null,
          onlineCount: 25,
          totalCount: 100,
          boostLevel: 2,
          boostCount: 7,
          status: 'ONLINE',
        },
      ],
    });
  });

  it('excludes servers toggled OFF in effective permissions from the rendered grid', async () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 4,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: () => true,
      hasServerPermission: (slugOrId: string) => slugOrId === 'server-2',
      isRouteAllowed: () => true,
    });

    render(<ServersPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Server 2')).toBeInTheDocument();
    });

    expect(screen.queryByText('Server 1')).not.toBeInTheDocument();
  });
});
