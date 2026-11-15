'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToast, RngLoadingSpinner } from '@/components/common';
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
        const token = localStorage.getItem('accessToken') || undefined;
        const res = await fetchRoleHierarchyMatrix(token);
        if (isMounted && res.success && res.data) {
          setRanks(res.data.ranks || []);
          setDesignations(res.data.designations || []);
          setCells(res.data.cells || {});
        }
      } catch {
        // Fallback or error handled gracefully
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
      const token = localStorage.getItem('accessToken') || undefined;
      await addRoleToMatrix(
        { rankWeight, designationId, name: roleName },
        token
      );
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Role Added',
      description: `${roleName} registered at weight ${rankWeight}.`,
    });
  };

  const handleAddDesignation = async (name: string) => {
    const newId = `des_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
    const newDes: MatrixDesignationItem = { id: newId, name };

    setDesignations((prev) => [...prev, newDes]);

    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await addDesignationToMatrix({ name }, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Designation Column Added',
      description: `Column "${name}" created across all rank tiers.`,
    });
  };

  const handleAddRank = async (code: string, weight: number, position: 'prepend' | 'append') => {
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
      const token = localStorage.getItem('accessToken') || undefined;
      await addRankToMatrix({ code, weight, position }, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Rank Row Added',
      description: `Tier ${code} (weight ${weight}) inserted.`,
    });
  };

  // Edit / Update Handlers (PATCH)
  const handleUpdateRole = async (roleId: string, name: string) => {
    setCells((prev) => {
      const next: Record<string, PopoverRoleItem[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        next[key] = list.map((r) => (r.id === roleId ? { ...r, name } : r));
      }
      return next;
    });

    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await updateRoleInMatrix(roleId, { name }, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Role Updated',
      description: `Role renamed to "${name}".`,
    });
  };

  const handleUpdateDesignation = async (designationId: string, name: string) => {
    setDesignations((prev) =>
      prev.map((d) => (d.id === designationId ? { ...d, name } : d))
    );

    try {
      const token = localStorage.getItem('accessToken') || undefined;
      await updateDesignationInMatrix(designationId, { name }, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Designation Updated',
      description: `Column renamed to "${name}".`,
    });
  };

  const handleUpdateRank = async (
    originalWeight: number,
    code: string,
    newWeight: number
  ) => {
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
      const token = localStorage.getItem('accessToken') || undefined;
      await updateRankInMatrix(
        originalWeight,
        { code, weight: newWeight },
        token
      );
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Rank Tier Updated',
      description: `Tier updated to ${code} (weight ${newWeight}).`,
    });
  };

  // Delete Handlers
  const handleDeleteRole = async (roleId: string) => {
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
      const token = localStorage.getItem('accessToken') || undefined;
      await deleteRoleFromMatrix(roleId, token);
    } catch {
      // Optimistic update retained
    }

    if (deletedName) {
      toast({
        type: 'info',
        title: 'Role Removed',
        description: `${deletedName} removed from matrix.`,
      });
    }
  };

  const handleDeleteDesignation = async (designationId: string) => {
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
      const token = localStorage.getItem('accessToken') || undefined;
      await deleteDesignationFromMatrix(designationId, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Designation Column Deleted',
      description: `Column "${des?.name || designationId}" and its roles removed.`,
    });
  };

  const handleDeleteRank = async (rankWeight: number) => {
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
      const token = localStorage.getItem('accessToken') || undefined;
      await deleteRankFromMatrix(rankWeight, token);
    } catch {
      // Optimistic update retained
    }

    toast({
      type: 'success',
      title: 'Rank Row Deleted',
      description: `Tier ${rank?.code || rankWeight} removed from matrix.`,
    });
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
