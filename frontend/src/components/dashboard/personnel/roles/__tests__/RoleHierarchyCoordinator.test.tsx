import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleHierarchyCoordinator } from '../RoleHierarchyCoordinator';
import * as personnelApi from '@/lib/api/dashboard/personnel';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/core/client', () => ({
  getStoredAccessToken: vi.fn().mockReturnValue('mock-jwt-token'),
}));

vi.mock('@/lib/api/dashboard/personnel', () => ({
  fetchRoleHierarchyMatrix: vi.fn(),
  addRoleToMatrix: vi.fn(),
  addDesignationToMatrix: vi.fn(),
  addRankToMatrix: vi.fn(),
  updateRoleInMatrix: vi.fn(),
  updateDesignationInMatrix: vi.fn(),
  updateRankInMatrix: vi.fn(),
  deleteRoleFromMatrix: vi.fn(),
  deleteDesignationFromMatrix: vi.fn(),
  deleteRankFromMatrix: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('RoleHierarchyCoordinator Matrix Integration', () => {
  const mockInitialMatrix: personnelApi.RoleHierarchyMatrixPayload = {
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
      data: mockInitialMatrix,
    });
  });

  it('renders loading spinner and loads initial matrix from API', async () => {
    renderWithToast(<RoleHierarchyCoordinator />);

    expect(screen.getByText(/Synchronizing Role Hierarchy Matrix/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(personnelApi.fetchRoleHierarchyMatrix).toHaveBeenCalledWith('mock-jwt-token');
      expect(screen.getByText('Chief High Command')).toBeInTheDocument();
      expect(screen.getByText('High Command')).toBeInTheDocument();
      expect(screen.getByText('Minister')).toBeInTheDocument();
    });
  });

  it('renders rank rows and designation column headers correctly', async () => {
    renderWithToast(<RoleHierarchyCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('R9')).toBeInTheDocument();
      expect(screen.getByText('R8')).toBeInTheDocument();
      expect(screen.getByText('R5')).toBeInTheDocument();
      expect(screen.getByText('Supreme')).toBeInTheDocument();
      expect(screen.getByText('Ministry of Tech')).toBeInTheDocument();
    });
  });

  it('filters matrix roles when a search query is entered into the toolbar', async () => {
    renderWithToast(<RoleHierarchyCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Chief High Command')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search roles across hierarchy/i);
    fireEvent.change(searchInput, { target: { value: 'Minister' } });

    expect(screen.getByText('Minister')).toBeInTheDocument();
  });

  it('dispatches addDesignationToMatrix and synchronizes with server response', async () => {
    const updatedMatrix: personnelApi.RoleHierarchyMatrixPayload = {
      ...mockInitialMatrix,
      designations: [
        ...mockInitialMatrix.designations,
        { id: 'finances', name: 'Ministry of Finances' },
      ],
    };

    vi.mocked(personnelApi.addDesignationToMatrix).mockResolvedValue({
      success: true,
      data: updatedMatrix,
    });

    renderWithToast(<RoleHierarchyCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Minister')).toBeInTheDocument();
    });

    const addDesignationBtn = screen.getByRole('button', { name: /Add Designation/i });
    fireEvent.click(addDesignationBtn);

    expect(screen.getByText(/Add New Designation Column/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/e\.g\. Ministry of Intelligence/i);
    fireEvent.change(input, { target: { value: 'Ministry of Finances' } });

    const submitBtn = screen.getByRole('button', { name: /Create Designation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(personnelApi.addDesignationToMatrix).toHaveBeenCalledWith(
        { name: 'Ministry of Finances' },
        'mock-jwt-token'
      );
      expect(screen.getByText('Ministry of Finances')).toBeInTheDocument();
    });
  });

  it('dispatches deleteRoleFromMatrix when a role is deleted', async () => {
    const matrixAfterDelete: personnelApi.RoleHierarchyMatrixPayload = {
      ...mockInitialMatrix,
      cells: {
        ...mockInitialMatrix.cells,
        '9_supreme': [],
      },
    };

    vi.mocked(personnelApi.deleteRoleFromMatrix).mockResolvedValue({
      success: true,
      data: matrixAfterDelete,
    });

    renderWithToast(<RoleHierarchyCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Chief High Command')).toBeInTheDocument();
    });

    // Open cell popover by clicking cell trigger
    const cellTrigger = screen.getByLabelText(/View roles for Supreme at R9/i);
    fireEvent.click(cellTrigger);

    // Click remove role button
    const deleteBtn = screen.getByLabelText(/Remove role from this cell/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(personnelApi.deleteRoleFromMatrix).toHaveBeenCalledWith('role_1', 'mock-jwt-token');
    });
  });

  it('handles API error on role addition gracefully, rolls back optimistic state and re-fetches authoritative server matrix', async () => {
    vi.mocked(personnelApi.addRoleToMatrix).mockRejectedValueOnce(
      new Error('Forbidden: Insufficient clearance')
    );

    renderWithToast(<RoleHierarchyCoordinator />);

    await waitFor(() => {
      expect(screen.getByText('Chief High Command')).toBeInTheDocument();
    });

    // Open add role modal for cell
    const addRoleBtn = screen.getByLabelText(/Add role to Supreme at R9/i);
    fireEvent.click(addRoleBtn);

    expect(screen.getByText(/Add Role to Matrix/i)).toBeInTheDocument();

    const roleInput = screen.getByPlaceholderText(/e\.g\. Chancellor of Rivals/i);
    fireEvent.change(roleInput, { target: { value: 'Test Rogue Role' } });

    const submitRoleBtn = screen.getByRole('button', { name: /^Add Role$/i });
    fireEvent.click(submitRoleBtn);

    await waitFor(() => {
      expect(personnelApi.addRoleToMatrix).toHaveBeenCalledWith(
        { rankWeight: 9, designationId: 'supreme', name: 'Test Rogue Role' },
        'mock-jwt-token'
      );
      // Confirms resync fetch occurred on rejection
      expect(personnelApi.fetchRoleHierarchyMatrix).toHaveBeenCalledTimes(2);
      // Confirms optimistic update rolled back
      expect(screen.queryByText('Test Rogue Role')).not.toBeInTheDocument();
    });
  });
});
