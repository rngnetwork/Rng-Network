import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PermissionsGuard } from '../PermissionsGuard';
import { useEffectivePermissions } from '../EffectivePermissionsContext';

const mockUsePathname = vi.fn<() => string>();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock('../EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

describe('PermissionsGuard', () => {
  const exitPreviewMode = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while permissions are resolving without flashing children', () => {
    mockUsePathname.mockReturnValue('/dashboard/whitelist');
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: true,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 0,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode,
      hasPermission: () => false,
      hasServerPermission: () => false,
      isRouteAllowed: () => false,
    });

    render(
      <PermissionsGuard>
        <div>Protected Whitelist Content</div>
      </PermissionsGuard>
    );

    expect(screen.getByText(/Verifying Clearance/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Whitelist Content')).not.toBeInTheDocument();
  });

  it('blocks direct URL entry with 403 view and allows exiting preview mode', () => {
    mockUsePathname.mockReturnValue('/dashboard/servers/server-1/settings');
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
      hasPermission: () => false,
      hasServerPermission: () => false,
      isRouteAllowed: () => false,
    });

    render(
      <PermissionsGuard>
        <div>Server 1 Settings</div>
      </PermissionsGuard>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Access Restricted \(403\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Server 1 Settings')).not.toBeInTheDocument();

    const exitBtn = screen.getByRole('button', { name: /Exit Preview/i });
    fireEvent.click(exitBtn);
    expect(exitPreviewMode).toHaveBeenCalledTimes(1);
  });

  it('renders children when route is permitted', () => {
    mockUsePathname.mockReturnValue('/dashboard/embeds');
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 5,
      refreshPermissions: vi.fn(),
      enterPreviewMode: vi.fn(),
      exitPreviewMode,
      hasPermission: () => true,
      hasServerPermission: () => true,
      isRouteAllowed: () => true,
    });

    render(
      <PermissionsGuard>
        <div>Embed Builder Workspace</div>
      </PermissionsGuard>
    );

    expect(screen.getByText('Embed Builder Workspace')).toBeInTheDocument();
  });
});
