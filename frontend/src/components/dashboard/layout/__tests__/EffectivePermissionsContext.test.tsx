import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  EffectivePermissionsProvider,
  useEffectivePermissions,
} from '../EffectivePermissionsContext';
import * as permsApi from '@/lib/api/dashboard/personnel/perms';
import * as clientApi from '@/lib/api/core/client';

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-token'),
  getStoredPreviewRoleId: vi.fn().mockReturnValue(null),
  setStoredPreviewRoleId: vi.fn(),
  clearStoredPreviewRoleId: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/personnel/perms', () => ({
  fetchMyEffectivePermissions: vi.fn(),
}));

const Probe: React.FC = () => {
  const { loading, hasPermission } = useEffectivePermissions();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="whitelist-enabled">
        {String(hasPermission('dashboard', 'dashboard.whitelist'))}
      </span>
      <span data-testid="whitelist-full-access">
        {String(hasPermission('dashboard', 'dashboard.whitelist', 'fullAccess'))}
      </span>
    </div>
  );
};

describe('EffectivePermissionsContext boolean leaf evaluation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientApi.getStoredAccessToken).mockReturnValue('mock-token');
  });

  it('returns true for boolean leaf flags like dashboard.whitelist.fullAccess when enabled and parents are enabled', async () => {
    vi.mocked(permsApi.fetchMyEffectivePermissions).mockResolvedValue({
      success: true,
      data: {
        userId: '50',
        rolesEvaluated: ['des_sec:R6 Role'],
        isPreviewMode: false,
        previewRoleId: null,
        previewRoleName: null,
        callerMaxRankWeight: 6,
        permissions: {
          dashboard: { enabled: true },
          'dashboard.whitelist': { enabled: true, fullAccess: true },
        },
      },
    });

    render(
      <EffectivePermissionsProvider>
        <Probe />
      </EffectivePermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('whitelist-enabled')).toHaveTextContent('true');
    });
    expect(screen.getByTestId('whitelist-full-access')).toHaveTextContent('true');
  });

  it('returns false for boolean leaf fullAccess when fullAccess is false or parent section is disabled', async () => {
    vi.mocked(permsApi.fetchMyEffectivePermissions).mockResolvedValue({
      success: true,
      data: {
        userId: '50',
        rolesEvaluated: ['des_sec:R6 Role'],
        isPreviewMode: false,
        previewRoleId: null,
        previewRoleName: null,
        callerMaxRankWeight: 6,
        permissions: {
          dashboard: { enabled: true },
          'dashboard.whitelist': { enabled: false, fullAccess: true },
        },
      },
    });

    render(
      <EffectivePermissionsProvider>
        <Probe />
      </EffectivePermissionsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('whitelist-enabled')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('whitelist-full-access')).toHaveTextContent('false');
  });
});
