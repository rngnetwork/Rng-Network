import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonnelPermsCoordinator } from '../PersonnelPermsCoordinator';
import * as permsApi from '@/lib/api/dashboard/personnel/perms';
import type { PermsExplorerResponse } from '@/lib/model/personnel/perms';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
}));

vi.mock('@/lib/api/dashboard/personnel/perms', () => ({
  fetchPermsExplorer: vi.fn(),
  updateRolePermissions: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('PersonnelPermsCoordinator File Explorer Navigation', () => {
  const samplePerms = {
    dashboard: { enabled: true },
    'dashboard.servers': {
      enabled: true,
      'dashboard.servers.[serverId]': {
        'rednecks-gaming': {
          enabled: true,
          settings: { enabled: true },
          botconfig: { enabled: true },
          embeds: { enabled: true },
          analytics: { enabled: true },
        },
        'rednecks-administrative-center': {
          enabled: true,
          settings: { enabled: true },
          botconfig: { enabled: true },
          embeds: { enabled: true },
          analytics: { enabled: true },
        },
      },
    },
    'dashboard.embeds': { enabled: true },
    'dashboard.botconfig': { enabled: true },
    'dashboard.personnel': {
      enabled: true,
      'dashboard.personnel.roles': { enabled: true },
      'dashboard.personnel.perms': { enabled: true },
    },
    'dashboard.whitelist': { enabled: true, fullAccess: true },
    'dashboard.account': { enabled: true },
  };

  const mockExplorerResponse: PermsExplorerResponse = {
    folders: [
      {
        id: 'des_supreme',
        name: 'Supreme',
        files: [
          {
            id: 'des_supreme:Chief High Command',
            name: 'Chief High Command',
            fileName: 'Chief High Command.json',
            designationId: 'des_supreme',
            designationName: 'Supreme',
            rankWeight: 9,
            rankCode: 'R9',
            schema: {
              title: '(Personnel) (Permission System)',
              metadata: {
                role_name: 'Chief High Command',
                designation_id: 'des_supreme',
                designation_name: 'Supreme',
                code: 'R9',
                weight: 9,
                version: 0,
              },
              permissions: samplePerms,
            },
          },
          {
            id: 'des_supreme:High Command',
            name: 'High Command',
            fileName: 'High Command.json',
            designationId: 'des_supreme',
            designationName: 'Supreme',
            rankWeight: 8,
            rankCode: 'R8',
            schema: {
              title: '(Personnel) (Permission System)',
              metadata: {
                role_name: 'High Command',
                designation_id: 'des_supreme',
                designation_name: 'Supreme',
                code: 'R8',
                weight: 8,
                version: 0,
              },
              permissions: samplePerms,
            },
          },
        ],
      },
      {
        id: 'des_tech',
        name: 'Ministry of Tech',
        files: [
          {
            id: 'des_tech:Minister',
            name: 'Minister',
            fileName: 'Minister.json',
            designationId: 'des_tech',
            designationName: 'Ministry of Tech',
            rankWeight: 5,
            rankCode: 'R5',
            schema: {
              title: '(Personnel) (Permission System)',
              metadata: {
                role_name: 'Minister',
                designation_id: 'des_tech',
                designation_name: 'Ministry of Tech',
                code: 'R5',
                weight: 5,
                version: 0,
              },
              permissions: samplePerms,
            },
          },
        ],
      },
    ],
    servers: [
      { slug: 'rednecks-gaming', name: 'Rednecks Gaming' },
      { slug: 'rednecks-administrative-center', name: 'Rednecks Administrative Center' },
    ],
    labels: {
      dashboard: 'Dashboard',
      'dashboard.servers': 'Dashboard : Servers',
      'dashboard.embeds': 'Dashboard : Embeds',
      'dashboard.botconfig': 'Dashboard : Botconfig',
      'dashboard.personnel': 'Dashboard : Personnel',
      'dashboard.whitelist': 'Dashboard : Whitelist',
      'dashboard.account': 'Dashboard : Account',
      settings: 'Settings',
      botconfig: 'Botconfig',
      embeds: 'Embeds',
      analytics: 'Analytics',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(permsApi.fetchPermsExplorer).mockResolvedValue({
      success: true,
      data: mockExplorerResponse,
    });
    vi.mocked(permsApi.updateRolePermissions).mockResolvedValue({
      success: true,
      data: {
        roleId: 'des_supreme:Chief High Command',
        designationId: 'des_supreme',
        designationName: 'Supreme',
        roleName: 'Chief High Command',
        rankWeight: 9,
        rankCode: 'R9',
        permissions: samplePerms,
        labels: mockExplorerResponse.labels,
        version: 1,
        updatedBy: 'chief@rng.gg',
        updatedAt: '2026-11-25T12:00:00Z',
      },
    });
  });

  it('renders root view with designation folders', async () => {
    renderWithToast(<PersonnelPermsCoordinator />);

    expect(
      screen.getByText(/Synchronizing Role Hierarchy/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hierarchy')).toBeInTheDocument();
    });

    // Root folder cards are rendered
    expect(screen.getByText('Supreme')).toBeInTheDocument();
    expect(screen.getByText('Ministry of Tech')).toBeInTheDocument();
    expect(screen.getByText('2 files')).toBeInTheDocument();
    expect(screen.getByText('1 file')).toBeInTheDocument();
    // Search bar is visible at root
    expect(screen.getByPlaceholderText('Search directory...')).toBeInTheDocument();
  });

  it('navigates into a folder and opens a role file in the editor', async () => {
    renderWithToast(<PersonnelPermsCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Supreme')).toBeInTheDocument();
    });

    // 1. Click on "Supreme" folder card
    const supremeFolder = screen.getByRole('button', {
      name: /Open designation folder Supreme/i,
    });
    fireEvent.click(supremeFolder);

    // 2. Folder view shows the files inside "Supreme" and search bar remains visible
    await waitFor(() => {
      expect(screen.getByText('Chief High Command.json')).toBeInTheDocument();
      expect(screen.getByText('High Command.json')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search directory...')).toBeInTheDocument();
    });

    // 3. Click on "Chief High Command.json" file card
    const fileCard = screen.getByRole('button', {
      name: /Open role file Chief High Command\.json/i,
    });
    fireEvent.click(fileCard);

    // 4. File editor deck is mounted and search bar is HIDDEN
    await waitFor(() => {
      expect(screen.getByLabelText('Visual RBAC')).toBeInTheDocument();
      expect(screen.getByLabelText('JSON Schema')).toBeInTheDocument();
      // Search bar is deleted/hidden when file is open
      expect(screen.queryByPlaceholderText(/Search/i)).not.toBeInTheDocument();
    });

    // 5. Switch to JSON Schema tab
    const jsonTab = screen.getByLabelText('JSON Schema');
    fireEvent.click(jsonTab);

    // 6. JSON Editor is displayed with valid schema
    await waitFor(() => {
      expect(screen.getByText('Valid JSON Schema')).toBeInTheDocument();
      expect(screen.getByText('Format JSON')).toBeInTheDocument();
      const textarea = screen.getByLabelText('JSON Schema Editor') as HTMLTextAreaElement;
      expect(textarea.value).toContain('Chief High Command');
      expect(textarea.value).toContain('Supreme');
    });

    // 7. Click "Back" in the breadcrumbs bar to return to folder view
    const backBtn = screen.getByRole('button', {
      name: /Navigate to previous directory level/i,
    });
    fireEvent.click(backBtn);

    // 8. We are back in the "Supreme" folder view and search bar is visible again
    await waitFor(() => {
      expect(screen.getByText('Chief High Command.json')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search directory...')).toBeInTheDocument();
    });

    // 9. Click "Back" again to return to root
    fireEvent.click(backBtn);

    // 10. We are back at the Root folder list
    await waitFor(() => {
      expect(screen.getByText('Ministry of Tech')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search directory...')).toBeInTheDocument();
    });
  });

  it('filters folders at root using search query', async () => {
    renderWithToast(<PersonnelPermsCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Supreme')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search directory/i);
    fireEvent.change(searchInput, { target: { value: 'Tech' } });

    expect(screen.getByText('Ministry of Tech')).toBeInTheDocument();
    expect(screen.queryByText('Supreme')).not.toBeInTheDocument();
  });

  it('renders nested accordions and toggles top-level enablers in header', async () => {
    renderWithToast(<PersonnelPermsCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Supreme')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Open designation folder Supreme/i }));
    await waitFor(() => {
      expect(screen.getByText('Chief High Command.json')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Open role file Chief High Command\.json/i })
    );

    // Visual RBAC is active by default
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard : Servers')).toBeInTheDocument();
      expect(screen.getByText('Dashboard : Personnel')).toBeInTheDocument();
      expect(screen.getByText('Dashboard : Whitelist')).toBeInTheDocument();
    });

    // Check direct nested server accordion items under Dashboard : Servers (no SERVERID)
    expect(screen.getByText('Rednecks Gaming')).toBeInTheDocument();
    expect(screen.getByText('Rednecks Administrative Center')).toBeInTheDocument();
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Botconfig').length).toBeGreaterThan(0);

    // Check Personnel sub-items: Roles & Permissions
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();

    // Check Whitelist sub-item: Full access (Visibility toggle was removed as redundant)
    expect(screen.getByText('Full access')).toBeInTheDocument();
    expect(screen.queryByText('Visibility')).not.toBeInTheDocument();

    // Non-expandable items have data-no-chevron
    expect(screen.getByText('Dashboard').parentElement).toHaveAttribute('data-no-chevron', 'true');
    expect(screen.getByText('Dashboard : Embeds').parentElement).toHaveAttribute('data-no-chevron', 'true');

    // Dashboard toggle is on the header
    const dashboardHeaderSwitch = screen.getByRole('switch', {
      name: 'Toggle Dashboard',
    });
    expect(dashboardHeaderSwitch).toHaveAttribute('aria-checked', 'true');

    // Find the enabler switch in the header for Dashboard : Personnel
    const personnelHeaderSwitch = screen.getByRole('switch', {
      name: 'Toggle Dashboard : Personnel',
    });
    expect(personnelHeaderSwitch).toHaveAttribute('aria-checked', 'true');

    // Click the top-level enabler to turn it OFF
    fireEvent.click(personnelHeaderSwitch);
    expect(personnelHeaderSwitch).toHaveAttribute('aria-checked', 'false');

    // Unsaved changes bar docks
    await waitFor(() => {
      expect(screen.getByText(/Careful — you have unsaved policy edits!/i)).toBeInTheDocument();
    });

    // Revert using Reset button on unsaved changes bar
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(personnelHeaderSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });
});
