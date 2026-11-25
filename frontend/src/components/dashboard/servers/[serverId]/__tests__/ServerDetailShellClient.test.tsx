import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ServerDetailShellClient } from '../ServerDetailShellClient';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import * as serverDetailApi from '@/lib/api/dashboard/servers/[serverId]';

vi.mock('next/navigation', () => ({
  useParams: () => ({ serverId: 'server-1' }),
  usePathname: () => '/dashboard/servers/server-1/settings',
}));

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/servers/[serverId]', () => ({
  fetchServerDetails: vi.fn(),
}));

describe('ServerDetailShellClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'test-token');
    vi.mocked(serverDetailApi.fetchServerDetails).mockResolvedValue({
      success: true,
      data: {
        id: '111',
        slug: 'server-1',
        name: 'Server 1',
        description: null,
        iconUrl: null,
        bannerUrl: null,
        onlineCount: 10,
        totalCount: 50,
        boostLevel: 1,
        boostCount: 2,
        features: [],
        afkChannelId: null,
        afkTimeout: null,
        systemChannelId: null,
        sendWelcome: false,
        stickerPrompt: false,
        boostMessage: false,
        setupTips: false,
        defaultMessageNotifications: null,
        vanityUrl: null,
        widgetEnabled: null,
        widgetChannelId: null,
      },
    });
  });

  it('blocks server detail shell and hides disallowed sub-tabs when server-1 is disabled', async () => {
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
      hasServerPermission: () => false,
      isRouteAllowed: () => false,
    });

    render(
      <ServerDetailShellClient>
        <div>Server 1 Inner Content</div>
      </ServerDetailShellClient>
    );

    await waitFor(() => {
      expect(screen.getByText(/Server Not Found/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Server 1 Inner Content')).not.toBeInTheDocument();
  });
});
