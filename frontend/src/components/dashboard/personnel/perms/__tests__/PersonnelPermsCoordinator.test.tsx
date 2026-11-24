import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonnelPermsCoordinator } from '../PersonnelPermsCoordinator';
import * as personnelApi from '@/lib/api/dashboard/personnel';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
}));

vi.mock('@/lib/api/dashboard/personnel', () => ({
  fetchRoleHierarchyMatrix: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('PersonnelPermsCoordinator File Explorer Navigation', () => {
  const mockHierarchyMatrix: personnelApi.RoleHierarchyMatrixPayload = {
    ranks: [
      { weight: 9, code: 'R9' },
      { weight: 8, code: 'R8' },
      { weight: 5, code: 'R5' },
    ],
    designations: [
      { id: 'supreme', name: 'Supreme' },
      { id: 'tech', name: 'Ministry of Tech' },
    ],
    cells: {
      '9_supreme': [{ id: 'role_1', name: 'Chief High Command' }],
      '8_supreme': [{ id: 'role_2', name: 'High Command' }],
      '5_tech': [{ id: 'role_3', name: 'Minister' }],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personnelApi.fetchRoleHierarchyMatrix).mockResolvedValue({
      success: true,
      data: mockHierarchyMatrix,
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
