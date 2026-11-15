'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToast, RngLoadingSpinner } from '@/components/common';
import { getStoredAccessToken } from '@/lib/api/core/client';
import {
  fetchRoleHierarchyMatrix,
  addRoleToMatrix,
  addDesignationToMatrix,
  addRankToMatrix,
  updateRoleInMatrix,
  updateDesignationInMatrix,
  updateRankInMatrix,
  deleteRoleFromMatrix,
  deleteDesignationFromMatrix,
  deleteRankFromMatrix,
  type MatrixRankItem,
  type MatrixDesignationItem,
  type PopoverRoleItem,
} from '@/lib/api/dashboard/personnel';
import { RoleMatrixToolbar } from './RoleMatrixToolbar';
import { RoleMatrixTable } from './RoleMatrixTable';
import { AddRoleModal } from './AddRoleModal';
import { EditRoleModal } from './EditRoleModal';
import { AddDesignationModal } from './AddDesignationModal';
import { EditDesignationModal } from './EditDesignationModal';
import { AddRankModal } from './AddRankModal';
import { EditRankModal } from './EditRankModal';

export type MatrixSelection =
  | { type: 'none' }
  | { type: 'rank'; weight: number; code: string }
  | { type: 'designation'; id: string; name: string };

export const RoleHierarchyCoordinator: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ranks, setRanks] = useState<MatrixRankItem[]>([]);
  const [designations, setDesignations] = useState<MatrixDesignationItem[]>([]);
  const [cells, setCells] = useState<Record<string, PopoverRoleItem[]>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Selection State
  const [selection, setSelection] = useState<MatrixSelection>({ type: 'none' });

  // Creation Modals state
  const [addRoleModal, setAddRoleModal] = useState<{
    isOpen: boolean;
    rankWeight: number;
    rankCode: string;
    designationId: string;
    designationName: string;
  }>({
    isOpen: false,
    rankWeight: 0,
    rankCode: '',
    designationId: '',
    designationName: '',
  });

  const [addDesignationModalOpen, setAddDesignationModalOpen] = useState(false);
  const [addRankModalOpen, setAddRankModalOpen] = useState(false);

  // Edit Modals state
  const [editRoleModal, setEditRoleModal] = useState<{
    isOpen: boolean;
    role: PopoverRoleItem | null;
  }>({
    isOpen: false,
    role: null,
  });

  const [editDesignationModal, setEditDesignationModal] = useState<{
    isOpen: boolean;
    designation: MatrixDesignationItem | null;
  }>({
    isOpen: false,
    designation: null,
  });

  const [editRankModal, setEditRankModal] = useState<{
    isOpen: boolean;
    rank: MatrixRankItem | null;
  }>({
    isOpen: false,
    rank: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadMatrix = async () => {
      try {
        const token = getStoredAccessToken() || undefined;
        const res = await fetchRoleHierarchyMatrix(token);
        if (isMounted) {
          if (res.success && res.data) {
            setRanks(res.data.ranks || []);
            setDesignations(res.data.designations || []);
            setCells(res.data.cells || {});
          } else {
            toast({
              type: 'error',
              title: 'Failed to Load Hierarchy Matrix',
              description: 'Server returned an unsuccessful response while loading roles.',
            });
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast({
            type: 'error',
            title: 'Failed to Synchronize Matrix',
            description:
              err instanceof Error
                ? err.message
                : 'Network failure encountered while loading role hierarchy matrix.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadMatrix();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRolesCount = useMemo(() => {
    return Object.values(cells).reduce((acc, list) => acc + list.length, 0);
  }, [cells]);

  // Selection Toggles
  const handleSelectRank = (weight: number, code: string) => {
    setSelection((prev) =>
      prev.type === 'rank' && prev.weight === weight
        ? { type: 'none' }
        : { type: 'rank', weight, code }
    );
  };

  const handleSelectDesignation = (id: string, name: string) => {
    setSelection((prev) =>
      prev.type === 'designation' && prev.id === id
        ? { type: 'none' }
        : { type: 'designation', id, name }
    );
  };

  const syncServerMatrix = (data: {
    ranks?: MatrixRankItem[];
    designations?: MatrixDesignationItem[];
    cells?: Record<string, PopoverRoleItem[]>;
  }) => {
    if (data.ranks) setRanks(data.ranks);
    if (data.designations) setDesignations(data.designations);
    if (data.cells) setCells(data.cells);
  };

  // Add / Create Handlers
  const handleOpenAddModal = (
    rankWeight: number,
    rankCode: string,
    designationId: string,
    designationName: string
  ) => {
    setAddRoleModal({
      isOpen: true,
      rankWeight,
      rankCode,
      designationId,
      designationName,
    });
  };

  const handleAddRole = async (rankWeight: number, designationId: string, roleName: string) => {
    const prevCells = cells;
    const cellKey = `${rankWeight}_${designationId}`;
    const newRole: PopoverRoleItem = {
      id: `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: roleName,
    };

    setCells((prev) => ({
      ...prev,
      [cellKey]: [...(prev[cellKey] || []), newRole],
    }));

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await addRoleToMatrix(
        { rankWeight, designationId, name: roleName },
        token
      );
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Role Added',
          description: `${roleName} registered at weight ${rankWeight}.`,
        });
      } else {
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Add Role',
          description: 'Server rejected the role creation request.',
        });
      }
    } catch (err: unknown) {
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Add Role',
        description: err instanceof Error ? err.message : 'An error occurred while adding the role.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleAddDesignation = async (name: string) => {
    const prevDesignations = designations;
    const newId = `des_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    const newDes: MatrixDesignationItem = { id: newId, name };

    setDesignations((prev) => [...prev, newDes]);

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await addDesignationToMatrix({ name }, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Designation Column Added',
          description: `Column "${name}" created across all rank tiers.`,
        });
      } else {
        setDesignations(prevDesignations);
        toast({
          type: 'error',
          title: 'Failed to Add Designation',
          description: 'Server rejected the designation creation request.',
        });
      }
    } catch (err: unknown) {
      setDesignations(prevDesignations);
      toast({
        type: 'error',
        title: 'Failed to Add Designation',
        description: err instanceof Error ? err.message : 'An error occurred while adding designation.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleAddRank = async (code: string, weight: number, position: 'prepend' | 'append') => {
    const prevRanks = ranks;
    const newRank: MatrixRankItem = { code, weight };

    setRanks((prev) => {
      if (position === 'prepend') {
        const updated = [newRank, ...prev.filter((r) => r.code !== code)];
        return updated.sort((a, b) => b.weight - a.weight);
      } else {
        const updated = [...prev.filter((r) => r.code !== code), newRank];
        return updated.sort((a, b) => b.weight - a.weight);
      }
    });

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await addRankToMatrix({ code, weight, position }, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Rank Row Added',
          description: `Tier ${code} (weight ${weight}) inserted.`,
        });
      } else {
        setRanks(prevRanks);
        toast({
          type: 'error',
          title: 'Failed to Add Rank',
          description: 'Server rejected the rank creation request.',
        });
      }
    } catch (err: unknown) {
      setRanks(prevRanks);
      toast({
        type: 'error',
        title: 'Failed to Add Rank',
        description: err instanceof Error ? err.message : 'An error occurred while adding rank tier.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  // Edit / Update Handlers (PATCH)
  const handleUpdateRole = async (roleId: string, name: string) => {
    const prevCells = cells;
    setCells((prev) => {
      const next: Record<string, PopoverRoleItem[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        next[key] = list.map((r) => (r.id === roleId ? { ...r, name } : r));
      }
      return next;
    });

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await updateRoleInMatrix(roleId, { name }, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Role Updated',
          description: `Role renamed to "${name}".`,
        });
      } else {
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Update Role',
          description: 'Server rejected the role update request.',
        });
      }
    } catch (err: unknown) {
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Update Role',
        description: err instanceof Error ? err.message : 'An error occurred while updating role.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleUpdateDesignation = async (designationId: string, name: string) => {
    const prevDesignations = designations;
    setDesignations((prev) =>
      prev.map((d) => (d.id === designationId ? { ...d, name } : d))
    );

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await updateDesignationInMatrix(designationId, { name }, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Designation Updated',
          description: `Column renamed to "${name}".`,
        });
      } else {
        setDesignations(prevDesignations);
        toast({
          type: 'error',
          title: 'Failed to Update Designation',
          description: 'Server rejected the designation update request.',
        });
      }
    } catch (err: unknown) {
      setDesignations(prevDesignations);
      toast({
        type: 'error',
        title: 'Failed to Update Designation',
        description: err instanceof Error ? err.message : 'An error occurred while updating designation.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleUpdateRank = async (
    originalWeight: number,
    code: string,
    newWeight: number
  ) => {
    const prevRanks = ranks;
    const prevCells = cells;

    setRanks((prev) => {
      const updated = prev.map((r) =>
        r.weight === originalWeight ? { code, weight: newWeight } : r
      );
      return updated.sort((a, b) => b.weight - a.weight);
    });

    if (originalWeight !== newWeight) {
      setCells((prev) => {
        const next: Record<string, PopoverRoleItem[]> = {};
        for (const [key, list] of Object.entries(prev)) {
          if (key.startsWith(`${originalWeight}_`)) {
            const desId = key.split('_')[1];
            next[`${newWeight}_${desId}`] = list;
          } else {
            next[key] = list;
          }
        }
        return next;
      });
    }

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await updateRankInMatrix(
        originalWeight,
        { code, weight: newWeight },
        token
      );
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Rank Tier Updated',
          description: `Tier updated to ${code} (weight ${newWeight}).`,
        });
      } else {
        setRanks(prevRanks);
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Update Rank',
          description: 'Server rejected the rank update request.',
        });
      }
    } catch (err: unknown) {
      setRanks(prevRanks);
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Update Rank',
        description: err instanceof Error ? err.message : 'An error occurred while updating rank tier.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  // Delete Handlers
  const handleDeleteRole = async (roleId: string) => {
    const prevCells = cells;
    let deletedName = '';
    setCells((prev) => {
      const next: Record<string, PopoverRoleItem[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        const found = list.find((r) => r.id === roleId);
        if (found) deletedName = found.name;
        next[key] = list.filter((r) => r.id !== roleId);
      }
      return next;
    });

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await deleteRoleFromMatrix(roleId, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        if (deletedName) {
          toast({
            type: 'info',
            title: 'Role Removed',
            description: `${deletedName} removed from matrix.`,
          });
        }
      } else {
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Delete Role',
          description: 'Server rejected the role deletion request.',
        });
      }
    } catch (err: unknown) {
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Delete Role',
        description: err instanceof Error ? err.message : 'An error occurred while deleting role.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleDeleteDesignation = async (designationId: string) => {
    const prevDesignations = designations;
    const prevCells = cells;
    const des = designations.find((d) => d.id === designationId);
    setDesignations((prev) => prev.filter((d) => d.id !== designationId));
    setCells((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.endsWith(`_${designationId}`)) {
          delete next[key];
        }
      }
      return next;
    });

    if (selection.type === 'designation' && selection.id === designationId) {
      setSelection({ type: 'none' });
    }

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await deleteDesignationFromMatrix(designationId, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Designation Column Deleted',
          description: `Column "${des?.name || designationId}" and its roles removed.`,
        });
      } else {
        setDesignations(prevDesignations);
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Delete Designation',
          description: 'Server rejected the designation deletion request.',
        });
      }
    } catch (err: unknown) {
      setDesignations(prevDesignations);
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Delete Designation',
        description: err instanceof Error ? err.message : 'An error occurred while deleting designation.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  const handleDeleteRank = async (rankWeight: number) => {
    const prevRanks = ranks;
    const prevCells = cells;
    const rank = ranks.find((r) => r.weight === rankWeight);
    setRanks((prev) => prev.filter((r) => r.weight !== rankWeight));
    setCells((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${rankWeight}_`)) {
          delete next[key];
        }
      }
      return next;
    });

    if (selection.type === 'rank' && selection.weight === rankWeight) {
      setSelection({ type: 'none' });
    }

    try {
      const token = getStoredAccessToken() || undefined;
      const res = await deleteRankFromMatrix(rankWeight, token);
      if (res.success && res.data) {
        syncServerMatrix(res.data);
        toast({
          type: 'success',
          title: 'Rank Row Deleted',
          description: `Tier ${rank?.code || rankWeight} removed from matrix.`,
        });
      } else {
        setRanks(prevRanks);
        setCells(prevCells);
        toast({
          type: 'error',
          title: 'Failed to Delete Rank',
          description: 'Server rejected the rank deletion request.',
        });
      }
    } catch (err: unknown) {
      setRanks(prevRanks);
      setCells(prevCells);
      toast({
        type: 'error',
        title: 'Failed to Delete Rank',
        description: err instanceof Error ? err.message : 'An error occurred while deleting rank tier.',
      });
      try {
        const token = getStoredAccessToken() || undefined;
        const refreshRes = await fetchRoleHierarchyMatrix(token);
        if (refreshRes.success && refreshRes.data) {
          syncServerMatrix(refreshRes.data);
        }
      } catch {
        // Safe against offline network drop
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RngLoadingSpinner size="lg" label="Synchronizing Role Hierarchy Matrix..." />
      </div>
    );
  }

  const selectedRankWeight = selection.type === 'rank' ? selection.weight : undefined;
  const selectedDesignationId = selection.type === 'designation' ? selection.id : undefined;

  return (
    <div className="flex flex-col gap-4 w-full">
      <RoleMatrixToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalRolesCount={totalRolesCount}
        totalDesignationsCount={designations.length}
        onOpenAddDesignation={() => setAddDesignationModalOpen(true)}
        onOpenAddRank={() => setAddRankModalOpen(true)}
      />

      <RoleMatrixTable
        ranks={ranks}
        designations={designations}
        cells={cells}
        searchQuery={searchQuery}
        selectedRankWeight={selectedRankWeight}
        selectedDesignationId={selectedDesignationId}
        onSelectRank={handleSelectRank}
        onSelectDesignation={handleSelectDesignation}
        onOpenAddModal={handleOpenAddModal}
        onOpenAddDesignationModal={() => setAddDesignationModalOpen(true)}
        onDeleteRole={handleDeleteRole}
        onEditRole={(role) => setEditRoleModal({ isOpen: true, role })}
        onDeleteRank={handleDeleteRank}
        onEditRank={(rank) => setEditRankModal({ isOpen: true, rank })}
        onDeleteDesignation={handleDeleteDesignation}
        onEditDesignation={(des) => setEditDesignationModal({ isOpen: true, designation: des })}
      />

      {/* Creation Modals */}
      <AddRoleModal
        isOpen={addRoleModal.isOpen}
        onClose={() => setAddRoleModal((p) => ({ ...p, isOpen: false }))}
        rankCode={addRoleModal.rankCode}
        rankWeight={addRoleModal.rankWeight}
        designationId={addRoleModal.designationId}
        designationName={addRoleModal.designationName}
        onAddRole={handleAddRole}
      />

      <AddDesignationModal
        isOpen={addDesignationModalOpen}
        onClose={() => setAddDesignationModalOpen(false)}
        onAddDesignation={handleAddDesignation}
      />

      <AddRankModal
        isOpen={addRankModalOpen}
        onClose={() => setAddRankModalOpen(false)}
        onAddRank={handleAddRank}
      />

      {/* Edit Modals (PATCH) */}
      <EditRoleModal
        isOpen={editRoleModal.isOpen}
        onClose={() => setEditRoleModal({ isOpen: false, role: null })}
        role={editRoleModal.role}
        onUpdateRole={handleUpdateRole}
      />

      <EditDesignationModal
        isOpen={editDesignationModal.isOpen}
        onClose={() => setEditDesignationModal({ isOpen: false, designation: null })}
        designation={editDesignationModal.designation}
        onUpdateDesignation={handleUpdateDesignation}
      />

      <EditRankModal
        isOpen={editRankModal.isOpen}
        onClose={() => setEditRankModal({ isOpen: false, rank: null })}
        rank={editRankModal.rank}
        onUpdateRank={handleUpdateRank}
      />
    </div>
  );
};
