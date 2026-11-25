import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardSidebarNav } from '../DashboardSidebarNav';
import { useEffectivePermissions } from '../EffectivePermissionsContext';
import * as serversApi from '@/lib/api/dashboard/servers';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/account',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('../EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/servers', () => ({
  fetchUserManagedServers: vi.fn(),
}));

vi.mock('@/lib/api/auth/session', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/api/auth/discord', () => ({
  getDiscordAvatarUrl: () => null,
}));

describe('DashboardSidebarNav', () => {
  const exitPreviewMode = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(serversApi.fetchUserManagedServers).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('filters sidebar links by effective permissions and renders Exit Preview button in preview mode', () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: true,
      previewRoleId: 'des_tech:Junior Dev',
      previewRoleName: 'Junior Dev',
      callerMaxRankWeight: 9,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode,
      hasPermission: (...path: string[]) => {
        const key = path[path.length - 1];
        return key === 'dashboard' || key === 'dashboard.embeds' || key === 'dashboard.account';
      },
      hasServerPermission: () => false,
      isRouteAllowed: () => true,
    });

    render(
      <DashboardSidebarNav
        user={{
          id: 1,
          email: 'chief@rng.gg',
          fullName: 'Chief',
          role: 'ROLE_CHIEF_HIGH_COMMAND',
          designations: 'Supreme',
          roles: 'Chief High Command',
          status: 'ACTIVE',
          discordLinked: false,
        }}
      />
    );

    expect(screen.getByText('Embed Builder')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.queryByText('Servers')).not.toBeInTheDocument();
    expect(screen.queryByText('Whitelist')).not.toBeInTheDocument();
    expect(screen.queryByText('Bot Modules')).not.toBeInTheDocument();
    expect(screen.queryByText('Personnel')).not.toBeInTheDocument();

    const exitBtns = screen.getAllByRole('button', { name: /Exit Preview \(Junior Dev\)/i });
    expect(exitBtns.length).toBeGreaterThan(0);
    fireEvent.click(exitBtns[0]);
    expect(exitPreviewMode).toHaveBeenCalledTimes(1);
  });
});
