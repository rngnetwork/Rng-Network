import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CyberWebCoordinator } from '../CyberWebCoordinator';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/components/dashboard/layout/EffectivePermissionsContext', () => ({
  useEffectivePermissions: vi.fn(),
}));

vi.mock('../CyberWebCanvas', () => ({
  CyberWebCanvas: ({ nodes }: { nodes: Array<{ id: string; status: string }> }) => (
    <div
      data-testid="cyber-web-canvas"
      data-locked-ids={nodes
        .filter((n) => n.status === 'locked')
        .map((n) => n.id)
        .join(',')}
    />
  ),
}));

describe('CyberWebCoordinator node permission locking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('greys out unauthorized route nodes instead of hiding them and blocks navigation', () => {
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
      hasPermission: () => false,
      hasServerPermission: () => false,
      isRouteAllowed: (pathname: string) => pathname === '/dashboard/account',
    });

    render(<CyberWebCoordinator />);

    const authButton = screen.getByRole('button', {
      name: 'Authentication & Authorization',
    });
    const whitelistButton = screen.getByRole('button', {
      name: 'Whitelist Management',
    });
    const serversButton = screen.getByRole('button', {
      name: 'Discord Server Module',
    });

    // Unauthorized nodes must remain visible (greyed out), not hidden from DOM
    expect(whitelistButton).toBeInTheDocument();
    expect(serversButton).toBeInTheDocument();
    expect(whitelistButton.className).toContain('opacity-60');
    expect(serversButton.className).toContain('opacity-60');
    expect(authButton.className).not.toContain('opacity-60');

    // Canvas receives derived locked status for disallowed routes
    const canvas = screen.getByTestId('cyber-web-canvas');
    expect(canvas.getAttribute('data-locked-ids')).toContain('whitelist-management');
    expect(canvas.getAttribute('data-locked-ids')).toContain('discord-server-module');

    // Dynamic telemetry counter reflects 1 / 9 live systems
    expect(screen.getByText('1 / 9 SYSTEMS LIVE')).toBeInTheDocument();

    // Clicking disallowed node must NOT navigate; clicking allowed node navigates
    fireEvent.click(whitelistButton, { button: 0 });
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(authButton, { button: 0 });
    expect(pushMock).toHaveBeenCalledWith('/dashboard/account');
  });
});
