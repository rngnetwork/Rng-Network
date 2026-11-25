import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RolePreviewTogglerCard } from '../RolePreviewTogglerCard';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import * as permsApi from '@/lib/api/dashboard/personnel/perms';

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-token'),
}));

vi.mock('@/lib/api/dashboard/personnel/perms', () => ({
  fetchPreviewRoleOptions: vi.fn(),
}));

describe('RolePreviewTogglerCard', () => {
  const enterPreviewMode = vi.fn().mockResolvedValue(undefined);
  const exitPreviewMode = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(permsApi.fetchPreviewRoleOptions).mockResolvedValue({
      success: true,
      data: [
        {
          roleId: 'des_tech:Junior Dev',
          designationId: 'des_tech',
          designationName: 'Ministry of Tech',
          roleName: 'Junior Dev',
          rankWeight: 1,
          rankCode: 'R1',
        },
        {
          roleId: 'des_supreme:High Command',
          designationId: 'des_supreme',
          designationName: 'Supreme',
          roleName: 'High Command',
          rankWeight: 8,
          rankCode: 'R8',
        },
      ],
    });
  });

  it('hides completely for non-R9/R8 personnel', () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: false,
      previewRoleId: null,
      previewRoleName: null,
      callerMaxRankWeight: 5,
      refreshPermissions: vi.fn(),
      enterPreviewMode,
      exitPreviewMode,
      hasPermission: () => true,
      hasServerPermission: () => true,
      isRouteAllowed: () => true,
    });

    const { container } = render(<RolePreviewTogglerCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loads selectable roles into Dropdown for R9/R8 and enters/exits temporary preview mode', async () => {
    vi.mocked(useEffectivePermissions).mockReturnValue({
      effectivePermissions: null,
      loading: false,
      isPreviewMode: true,
      previewRoleId: 'des_tech:Junior Dev',
      previewRoleName: 'Junior Dev',
      callerMaxRankWeight: 9,
      refreshPermissions: vi.fn(),
      enterPreviewMode,
      exitPreviewMode,
      hasPermission: () => true,
      hasServerPermission: () => true,
      isRouteAllowed: () => true,
    });

    render(<RolePreviewTogglerCard />);

    await waitFor(() => {
      expect(screen.getByText(/\[R1\] Ministry of Tech — Junior Dev/i)).toBeInTheDocument();
    });

    // Open custom Dropdown and pick High Command
    fireEvent.click(screen.getByRole('button', { name: /\[R1\] Ministry of Tech — Junior Dev/i }));
    const hcOption = await screen.findByText(/\[R8\] Supreme — High Command/i);
    fireEvent.click(hcOption);

    fireEvent.click(screen.getByRole('button', { name: /Switch Preview/i }));
    await waitFor(() => {
      expect(enterPreviewMode).toHaveBeenCalledWith('des_supreme:High Command');
    });

    fireEvent.click(screen.getByRole('button', { name: /Exit Preview/i }));
    await waitFor(() => {
      expect(exitPreviewMode).toHaveBeenCalledTimes(1);
    });
  });
});
