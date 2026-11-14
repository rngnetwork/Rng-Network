'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ShieldCheck, UserPlus, Lock } from 'lucide-react';
import { fetchCurrentUser } from '@/lib/api/auth/session';
import {
  fetchWhitelistedUsers,
  fetchPersonnelHierarchy,
  createWhitelistedUser,
  updateWhitelistedUser,
  deleteWhitelistedUser,
} from '@/lib/api/dashboard/whitelist';
import type { UserProfileData } from '@/lib/model/user';
import type {
  WhitelistedUser,
  CreateWhitelistPayload,
  UpdateWhitelistPayload,
  PersonnelHierarchyMap,
} from '@/lib/model/whitelist';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';
import { Alert } from '@/components/common/feedback/Alert';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { WhitelistFilterToolbar } from './WhitelistFilterToolbar';
import { WhitelistPersonnelTable } from './WhitelistPersonnelTable';
import { AddPersonnelModal, WhitelistModalFormState } from './AddPersonnelModal';
import { RankElevationModal } from './RankElevationModal';
import { RevokePersonnelModal } from './RevokePersonnelModal';


export const WhitelistPageCoordinator: React.FC = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [whitelistedUsers, setWhitelistedUsers] = useState<WhitelistedUser[]>([]);
  const [hierarchy, setHierarchy] = useState<PersonnelHierarchyMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>('ALL');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<WhitelistedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<WhitelistedUser | null>(null);

  const [formData, setFormData] = useState<WhitelistModalFormState>({
    email: '',
    userName: '',
    provider: 'EMAIL',
    designations: [],
    roles: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChiefHighCommand = useMemo(() => {
    const hasChiefRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'chief high command';
      }) || currentUser?.roles?.toLowerCase().includes('chief high command');
    return Boolean(currentUser?.role === 'ROLE_CHIEF_HIGH_COMMAND' || hasChiefRole);
  }, [currentUser]);

  const isHighCommand = useMemo(() => {
    if (isChiefHighCommand) return true;
    const hasHcRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command' || pure.toLowerCase() === 'chief high command';
      }) || currentUser?.roles?.toLowerCase().includes('high command');
    return Boolean(
      currentUser?.role === 'ROLE_HIGH_COMMAND' ||
        currentUser?.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
        hasHcRole
    );
  }, [currentUser, isChiefHighCommand]);

  const isMinister = useMemo(() => {
    if (isHighCommand) return false;
    const hasMinisterRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'minister';
      }) || currentUser?.roles?.toLowerCase().includes('minister');
    return Boolean(currentUser?.role === 'ROLE_MINISTER' || hasMinisterRole);
  }, [currentUser, isHighCommand]);

  const ministerMinistries = useMemo(() => {
    if (!isMinister || !currentUser) return [];
    const list = currentUser.designationList || [];
    return list.filter((d) => d.startsWith('Ministry of'));
  }, [isMinister, currentUser]);

  const canManage = isHighCommand || isMinister;

  const refreshData = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;

    const [userRes, hierRes, listRes] = await Promise.allSettled([
      fetchCurrentUser(currentToken),
      fetchPersonnelHierarchy(currentToken),
      fetchWhitelistedUsers(currentToken),
    ]);

    if (userRes.status === 'fulfilled' && userRes.value.success && userRes.value.data) {
      setCurrentUser(userRes.value.data);
    }
    if (hierRes.status === 'fulfilled' && hierRes.value.success && hierRes.value.data) {
      setHierarchy(hierRes.value.data);
    }
    if (listRes.status === 'fulfilled' && listRes.value.success && listRes.value.data) {
      setWhitelistedUsers(listRes.value.data);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [userRes, hierRes, listRes] = await Promise.allSettled([
          fetchCurrentUser(currentToken),
          fetchPersonnelHierarchy(currentToken),
          fetchWhitelistedUsers(currentToken),
        ]);

        if (isMounted) {
          if (userRes.status === 'fulfilled' && userRes.value.success && userRes.value.data) {
            setCurrentUser(userRes.value.data);
          }
          if (hierRes.status === 'fulfilled' && hierRes.value.success && hierRes.value.data) {
            setHierarchy(hierRes.value.data);
          }
          if (listRes.status === 'fulfilled' && listRes.value.success && listRes.value.data) {
            setWhitelistedUsers(listRes.value.data);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return whitelistedUsers.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.designations.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDesignation =
        selectedDesignationFilter === 'ALL' ||
        u.designations.includes(selectedDesignationFilter);

      return matchesSearch && matchesDesignation;
    });
  }, [whitelistedUsers, searchQuery, selectedDesignationFilter]);

  const openAddModal = () => {
    setFormError(null);
    setFormData({
      email: '',
      userName: '',
      provider: 'EMAIL',
      designations: isMinister && ministerMinistries.length > 0 ? [...ministerMinistries] : [],
      roles: [],
    });
    setAddModalOpen(true);
  };

  const openEditModal = (target: WhitelistedUser) => {
    setFormError(null);
    setUserToEdit(target);

    const normalizedRoles: string[] = [];
    target.roles.forEach((r) => {
      if (r.includes(':')) {
        normalizedRoles.push(r);
      } else {
        const matchingDes = target.designations.filter((d) => (hierarchy[d] || []).includes(r));
        if (matchingDes.length === 1) {
          normalizedRoles.push(`${matchingDes[0]}:${r}`);
        } else if (matchingDes.length > 1) {
          matchingDes.forEach((d) => normalizedRoles.push(`${d}:${r}`));
        } else {
          normalizedRoles.push(r);
        }
      }
    });

    setFormData({
      email: target.email,
      userName: target.userName,
      provider: target.provider,
      designations: [...target.designations],
      roles: normalizedRoles,
    });
    setEditModalOpen(true);
  };

  const handleToggleDesignation = (des: string) => {
    if (isMinister && !ministerMinistries.includes(des)) return;

    setFormData((prev) => {
      const exists = prev.designations.includes(des);
      const updatedDes = exists
        ? prev.designations.filter((d) => d !== des)
        : [...prev.designations, des];

      const updatedRoles = prev.roles.filter((r) => {
        if (r.includes(':')) {
          const [dept] = r.split(':');
          return updatedDes.includes(dept);
        }
        const validRolesForSelected = updatedDes.flatMap((d) => hierarchy[d] || []);
        return validRolesForSelected.includes(r);
      });

      return {
        ...prev,
        designations: updatedDes,
        roles: updatedRoles,
      };
    });
  };

  const handleToggleRoleForDept = (des: string, role: string) => {
    const scopedToken = `${des}:${role}`;
    const isEditingSelf = Boolean(userToEdit && currentUser && userToEdit.id === currentUser.id);

    if (!isChiefHighCommand && role === 'Chief High Command') return;
    if (isMinister && isEditingSelf && role === 'Minister' && ministerMinistries.includes(des)) {
      return;
    }
    if (
      isMinister &&
      !isEditingSelf &&
      (role === 'Minister' || role === 'High Command' || role === 'Chief High Command')
    ) {
      return;
    }

    setFormData((prev) => {
      const hasScoped = prev.roles.includes(scopedToken);
      const hasRaw = prev.roles.includes(role);
      const updatedRoles =
        hasScoped || hasRaw
          ? prev.roles.filter((r) => r !== scopedToken && r !== role)
          : [...prev.roles, scopedToken];

      return {
        ...prev,
        roles: updatedRoles,
      };
    });
  };

  const isRoleSelectedInDept = (des: string, role: string) => {
    const scopedToken = `${des}:${role}`;
    if (formData.roles.includes(scopedToken)) return true;
    if (formData.designations.length === 1 && formData.roles.includes(role)) return true;
    return false;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.userName) {
      setFormError('Email and Username are required');
      return;
    }
    if (formData.designations.length === 0) {
      setFormError('Please select at least one Designation');
      return;
    }
    if (formData.roles.length === 0) {
      setFormError('Please select at least one Role');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Authentication required');
      const payload: CreateWhitelistPayload = {
        email: formData.email.trim(),
        userName: formData.userName.trim(),
        provider: formData.provider,
        designations: formData.designations,
        roles: formData.roles,
      };

      const res = await createWhitelistedUser(token, payload);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Personnel Whitelisted',
          description: `${formData.email} added to the RNG whitelist.`,
        });
        setAddModalOpen(false);
        await refreshData();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to whitelist user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!userToEdit || !token) return;
    setFormError(null);

    if (formData.designations.length === 0) {
      setFormError('Please select at least one Designation');
      return;
    }
    if (formData.roles.length === 0) {
      setFormError('Please select at least one Role');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateWhitelistPayload = {
        userName: formData.userName.trim(),
        designations: formData.designations,
        roles: formData.roles,
      };

      const res = await updateWhitelistedUser(token, userToEdit.id, payload);
      if (res.success) {
        toast({
          type: 'success',
          title: 'Credentials Updated',
          description: `${userToEdit.email} updated.`,
        });
        setEditModalOpen(false);
        await refreshData();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const token = localStorage.getItem('accessToken');
    if (!userToDelete || !token) return;
    setIsSubmitting(true);

    try {
      const res = await deleteWhitelistedUser(token, userToDelete.id);
      if (res.success) {
        toast({
          type: 'info',
          title: 'Clearance Revoked',
          description: `${userToDelete.email} removed from whitelist.`,
        });
        setDeleteModalOpen(false);
        setUserToDelete(null);
        await refreshData();
      }
    } catch (err: unknown) {
      toast({
        type: 'error',
        title: 'Revocation Failed',
        description: err instanceof Error ? err.message : 'Failed to remove user',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditMember = (member: WhitelistedUser) => {
    const isMemberChiefHc =
      member.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'chief high command';
      });

    const isMemberHc =
      isMemberChiefHc ||
      member.role === 'ROLE_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command';
      });

    if (isChiefHighCommand) {
      if (isMemberChiefHc && member.id !== currentUser?.id) return false;
      return true;
    }
    if (isHighCommand) {
      if (isMemberHc && member.id !== currentUser?.id) return false;
      return true;
    }
    if (isMinister) {
      if (member.id === currentUser?.id) return true;
      if (isMemberHc) return false;
      const isMemberMinister =
        member.role === 'ROLE_MINISTER' ||
        member.roles.some((r) => {
          const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
          return pure.toLowerCase() === 'minister';
        });
      if (isMemberMinister) return false;
      return member.designations.some((d) => ministerMinistries.includes(d));
    }
    return false;
  };

  const canDeleteMember = (member: WhitelistedUser) => {
    const isMemberChiefHc =
      member.role === 'ROLE_CHIEF_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'chief high command';
      });

    const isMemberHc =
      isMemberChiefHc ||
      member.role === 'ROLE_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command';
      });

    if (member.id === currentUser?.id) return false;
    if (isMemberChiefHc) return false;
    if (isChiefHighCommand) return true;
    if (isHighCommand) return !isMemberHc;
    if (isMinister) {
      if (isMemberHc) return false;
      const isMemberMinister =
        member.role === 'ROLE_MINISTER' ||
        member.roles.some((r) => {
          const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
          return pure.toLowerCase() === 'minister';
        });
      if (isMemberMinister) return false;
      return member.designations.some((d) => ministerMinistries.includes(d));
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RngLoadingSpinner size="lg" label="Loading Personnel Registry..." />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-8 rounded-apple-xl bg-zinc-900/70 border border-white/10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-apple-lg bg-brand-red/10 border border-brand-red/20 flex items-center justify-center mx-auto mb-4 text-brand-red">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The Whitelist Control Center requires High Command or Minister authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Personnel Whitelist
              </h1>
              <Badge variant={isHighCommand ? 'crimson' : 'warning'}>
                {isChiefHighCommand
                  ? 'Chief High Command'
                  : isHighCommand
                  ? 'High Command'
                  : ministerMinistries.join(' & ') || 'Ministry Scoped'}
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-zinc-400">
              {isHighCommand
                ? 'Manage system-wide personnel credentials, designations, and permissions.'
                : `Scoped access: Manage personnel strictly within ${
                    ministerMinistries.join(' & ') || 'your assigned ministries'
                  }.`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={<UserPlus size={16} />}
          onClick={openAddModal}
        >
          Whitelist Member
        </Button>
      </div>

      <Alert
        variant="info"
        title="First-Time Login Password Provisioning"
        description="Whitelisted members with EMAIL provider do not require a pre-set password. On their first login attempt, entering a password automatically hashes it via BCrypt and initiates Discord OAuth2 2FA linking."
      />

      <WhitelistFilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDesignationFilter={selectedDesignationFilter}
        onDesignationChange={setSelectedDesignationFilter}
        hierarchy={hierarchy}
        totalCount={whitelistedUsers.length}
      />

      <WhitelistPersonnelTable
        users={filteredUsers}
        hierarchy={hierarchy}
        canEditMember={canEditMember}
        canDeleteMember={canDeleteMember}
        onEditMember={openEditModal}
        onDeleteMember={(member) => {
          setUserToDelete(member);
          setDeleteModalOpen(true);
        }}
      />

      <AddPersonnelModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        formData={formData}
        onChangeFormData={setFormData}
        hierarchy={hierarchy}
        isHighCommand={isHighCommand}
        isMinister={isMinister}
        ministerMinistries={ministerMinistries}
        onToggleDesignation={handleToggleDesignation}
        onToggleRoleForDept={handleToggleRoleForDept}
        isRoleSelectedInDept={isRoleSelectedInDept}
        onSubmit={(e) => void handleAddSubmit(e)}
        isSubmitting={isSubmitting}
        formError={formError}
      />

      <RankElevationModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userToEdit={userToEdit}
        currentUser={currentUser}
        formData={formData}
        onChangeFormData={setFormData}
        hierarchy={hierarchy}
        isHighCommand={isHighCommand}
        isMinister={isMinister}
        ministerMinistries={ministerMinistries}
        onToggleDesignation={handleToggleDesignation}
        onToggleRoleForDept={handleToggleRoleForDept}
        isRoleSelectedInDept={isRoleSelectedInDept}
        onSubmit={(e) => void handleEditSubmit(e)}
        isSubmitting={isSubmitting}
        formError={formError}
      />

      <RevokePersonnelModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        userToDelete={userToDelete}
        onConfirm={() => void handleDeleteConfirm()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
