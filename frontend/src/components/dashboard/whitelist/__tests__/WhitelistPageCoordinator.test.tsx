import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { WhitelistPageCoordinator } from '../WhitelistPageCoordinator';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import * as sessionApi from '@/lib/api/auth/session';
import * as whitelistApi from '@/lib/api/dashboard/whitelist';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/auth/session', () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/whitelist', () => ({
  fetchWhitelistedUsers: vi.fn(),
  fetchPersonnelHierarchy: vi.fn(),
  fetchHierarchyRankWeights: vi.fn(),
  createWhitelistedUser: vi.fn(),
  updateWhitelistedUser: vi.fn(),
  deleteWhitelistedUser: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('WhitelistPageCoordinator Permission-Driven Access & Dynamic Ranks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'test-token');

    vi.mocked(whitelistApi.fetchPersonnelHierarchy).mockResolvedValue({
      success: true,
      data: {
        Supreme: ['Chief High Command', 'High Command'],
        'Security Ops': ['Security Director', 'Security Lead', 'Security Watcher'],
      },
    });
    vi.mocked(whitelistApi.fetchHierarchyRankWeights).mockResolvedValue({
      success: true,
      data: {
        'Supreme:Chief High Command': 9,
        'Supreme:High Command': 8,
        'Security Ops:Security Director': 7,
        'Security Ops:Security Lead': 4,
        'Security Ops:Security Watcher': 2,
      },
    });
    vi.mocked(whitelistApi.fetchWhitelistedUsers).mockResolvedValue({
      success: true,
      data: [
        {
          id: 101,
          email: 'watcher@rng.com',
          userName: 'Watcher One',
          provider: 'EMAIL',
          role: 'ROLE_USER',
          rankWeight: 2,
          designations: ['Security Ops'],
          roles: ['Security Ops:Security Watcher'],
          discordLinked: true,
          status: 'ACTIVE',
          createdAt: '2026-11-26T00:00:00Z',
          updatedAt: '2026-11-26T00:00:00Z',
        },
        {
          id: 102,
          email: 'director@rng.com',
          userName: 'Director One',
          provider: 'EMAIL',
          role: 'ROLE_USER',
          rankWeight: 7,
          designations: ['Security Ops'],
          roles: ['Security Ops:Security Director'],
          discordLinked: true,
          status: 'ACTIVE',
          createdAt: '2026-11-26T00:00:00Z',
          updatedAt: '2026-11-26T00:00:00Z',
        },
      ],
    });
  });

  it('grants custom ROLE_USER access when dashboard.whitelist is enabled without fullAccess and scopes custom designation', async () => {
    vi.mocked(sessionApi.fetchCurrentUser).mockResolvedValue({
      success: true,
      data: {
        id: 50,
        email: 'lead@rng.com',
        fullName: 'Security Lead',
        role: 'ROLE_USER',
        designations: 'Security Ops',
        roles: 'Security Ops:Security Lead',
        designationList: ['Security Ops'],
        roleList: ['Security Ops:Security Lead'],
        discordLinked: true,
      },
    });

    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: {
        userId: '50',
        rolesEvaluated: ['des_sec:Security Lead'],
        isPreviewMode: false,
        previewRoleId: null,
        previewRoleName: null,
        callerMaxRankWeight: 4,
        permissions: {
          dashboard: { enabled: true },
          'dashboard.whitelist': { enabled: true, fullAccess: false },
        },
      },
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 4,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: (...path: string[]) => {
        const leaf = path[path.length - 1];
        return leaf === 'dashboard' || leaf === 'dashboard.whitelist';
      },
      hasServerPermission: () => false,
      isRouteAllowed: () => true,
    });

    renderWithToast(<WhitelistPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Whitelist Management')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Access Restricted/i)).not.toBeInTheDocument();

    // Watcher One (weight 2 < 4) is editable/deletable, Director One (weight 7 >= 4) is not
    const editButtons = screen.getAllByRole('button', { name: /Edit Watcher One/i });
    expect(editButtons.length).toBe(1);
    expect(screen.queryByRole('button', { name: /Edit Director One/i })).not.toBeInTheDocument();

    // Open Add Modal: Supreme must be disabled (unassigned), Security Ops enabled
    fireEvent.click(screen.getByRole('button', { name: /Whitelist Member/i }));
    const modalDialog = await screen.findByRole('dialog');
    expect(within(modalDialog).getByRole('button', { name: 'Supreme' })).toBeDisabled();
    expect(within(modalDialog).getByRole('button', { name: 'Security Ops' })).not.toBeDisabled();
    expect(within(modalDialog).getByRole('button', { name: 'Security Director' })).toBeDisabled();
    expect(within(modalDialog).getByRole('button', { name: 'Security Watcher' })).not.toBeDisabled();
  });

  it('grants custom ROLE_USER system-wide access when dashboard.whitelist.fullAccess is true', async () => {
    vi.mocked(sessionApi.fetchCurrentUser).mockResolvedValue({
      success: true,
      data: {
        id: 50,
        email: 'lead@rng.com',
        fullName: 'Security Lead',
        role: 'ROLE_USER',
        designations: 'Security Ops',
        roles: 'Security Ops:Security Lead',
        designationList: ['Security Ops'],
        roleList: ['Security Ops:Security Lead'],
        discordLinked: true,
      },
    });

    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: {
        userId: '50',
        rolesEvaluated: ['des_sec:Security Lead'],
        isPreviewMode: false,
        previewRoleId: null,
        previewRoleName: null,
        callerMaxRankWeight: 4,
        permissions: {
          dashboard: { enabled: true },
          'dashboard.whitelist': { enabled: true, fullAccess: true },
        },
      },
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 4,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: (...path: string[]) => {
        const leaf = path[path.length - 1];
        return leaf === 'dashboard' || leaf === 'dashboard.whitelist' || leaf === 'fullAccess';
      },
      hasServerPermission: () => false,
      isRouteAllowed: () => true,
    });

    renderWithToast(<WhitelistPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Whitelist Management')).toBeInTheDocument();
      expect(screen.getByText('Full Access')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Whitelist Member/i }));
    const modalDialog = await screen.findByRole('dialog');
    expect(within(modalDialog).getByRole('button', { name: 'Supreme' })).not.toBeDisabled();
    expect(within(modalDialog).getByRole('button', { name: 'Security Ops' })).not.toBeDisabled();
  });

  it('blocks access with Access Restricted when dashboard.whitelist permission is disabled', async () => {
    vi.mocked(sessionApi.fetchCurrentUser).mockResolvedValue({
      success: true,
      data: {
        id: 50,
        email: 'lead@rng.com',
        fullName: 'Security Lead',
        role: 'ROLE_USER',
        discordLinked: true,
      },
    });

    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: {
        userId: '50',
        rolesEvaluated: [],
        isPreviewMode: false,
        previewRoleId: null,
        previewRoleName: null,
        callerMaxRankWeight: 1,
        permissions: {
          dashboard: { enabled: true },
          'dashboard.whitelist': { enabled: false, fullAccess: false },
        },
      },
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 1,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode: vi.fn(),
      hasPermission: () => false,
      hasServerPermission: () => false,
      isRouteAllowed: () => false,
    });

    renderWithToast(<WhitelistPageCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });
});
