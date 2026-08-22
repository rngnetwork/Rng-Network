"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Lock
} from 'lucide-react';
import {
  api,
  UserProfileData,
  WhitelistedUser,
  CreateWhitelistPayload,
  UpdateWhitelistPayload,
  PersonnelHierarchyMap,
  getDiscordAvatarUrl
} from '@/lib/api';

export default function WhitelistPage() {
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [whitelistedUsers, setWhitelistedUsers] = useState<WhitelistedUser[]>([]);
  const [hierarchy, setHierarchy] = useState<PersonnelHierarchyMap>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>('ALL');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<WhitelistedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<WhitelistedUser | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    email: string;
    userName: string;
    provider: string;
    designations: string[];
    roles: string[];
  }>({
    email: '',
    userName: '',
    provider: 'EMAIL',
    designations: [],
    roles: [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const isHighCommand = useMemo(() => {
    const hasHcRole =
      currentUser?.roleList?.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command';
      }) || currentUser?.roles?.toLowerCase().includes('high command');
    return Boolean(currentUser?.role === 'ROLE_HIGH_COMMAND' || hasHcRole);
  }, [currentUser]);

  const isMinister = useMemo(() => {
    if (isHighCommand) return false; // High Command strictly overrides Minister privileges
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

  // Re-fetch data on manual actions (Add / Edit / Delete)
  const refreshData = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;

    try {
      const [userRes, hierRes, listRes] = await Promise.allSettled([
        api.fetchCurrentUser(currentToken),
        api.fetchPersonnelHierarchy(currentToken),
        api.fetchWhitelistedUsers(currentToken)
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
    } catch (err: unknown) {
      console.error('Failed to refresh data:', err);
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
          api.fetchCurrentUser(currentToken),
          api.fetchPersonnelHierarchy(currentToken),
          api.fetchWhitelistedUsers(currentToken)
        ]);

        if (isMounted) {
          if (userRes.status === 'fulfilled' && userRes.value.success && userRes.value.data) {
            setCurrentUser(userRes.value.data);
          }
          if (hierRes.status === 'fulfilled' && hierRes.value.success && hierRes.value.data) {
            setHierarchy(hierRes.value.data);
          } else {
            setHierarchy({
              "Supreme": ["High Command"],
              "Ministry of Internal affairs": ["Minister", "Secretary", "Senior agent", "agent"],
              "Ministry of Personell": ["Minister", "Secretary", "Magister Officiorum", "Tribunus", "Legatus"],
              "Ministry of Tech": ["Minister", "Secretary", "Tech Specialist", "Senior Dev", "Junior Dev"],
              "Ministry of Finances": ["Minister", "Secretary", "Digital assets officer", "Regional treasurer", "PayPal treasurer"],
              "Ministry of Culture": ["Minister", "Secretary"],
              "Ministry of External affairs": ["Minister", "Secretary"],
              "Chancellory": ["Chancellor of Roughnuts", "Chancellor of Rednecks Gaming", "Chancellor of Rivals"]
            });
          }
          if (listRes.status === 'fulfilled' && listRes.value.success && listRes.value.data) {
            setWhitelistedUsers(listRes.value.data);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to initialize whitelist page:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Filtered Users
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

  // Open Add Modal
  const openAddModal = () => {
    setFormError(null);
    if (isMinister && ministerMinistries.length > 0) {
      setFormData({
        email: '',
        userName: '',
        provider: 'EMAIL',
        designations: [...ministerMinistries],
        roles: [],
      });
    } else {
      setFormData({
        email: '',
        userName: '',
        provider: 'EMAIL',
        designations: [],
        roles: [],
      });
    }
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (target: WhitelistedUser) => {
    setFormError(null);
    setUserToEdit(target);

    // Normalize roles to department-scoped tokens
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

  // Toggle designation selection
  const handleToggleDesignation = (des: string) => {
    if (isMinister && !ministerMinistries.includes(des)) return; // Minister cannot select unassigned ministries

    setFormData((prev) => {
      const exists = prev.designations.includes(des);
      let updatedDes: string[];
      if (exists) {
        updatedDes = prev.designations.filter((d) => d !== des);
      } else {
        updatedDes = [...prev.designations, des];
      }

      // Filter out roles that belong to deselected designations
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

  // Toggle role selection for a specific department
  const handleToggleRoleForDept = (des: string, role: string) => {
    const scopedToken = `${des}:${role}`;
    const isEditingSelf = Boolean(userToEdit && currentUser && userToEdit.id === currentUser.id);

    // Minister editing self: Cannot untoggle Minister role in any of their assigned minister ministries
    if (isMinister && isEditingSelf && role === 'Minister' && ministerMinistries.includes(des)) {
      return;
    }

    // Minister editing another account: Cannot assign Minister or High Command
    if (isMinister && !isEditingSelf && (role === 'Minister' || role === 'High Command')) {
      return;
    }

    setFormData((prev) => {
      const hasScoped = prev.roles.includes(scopedToken);
      const hasRaw = prev.roles.includes(role);

      let updatedRoles: string[];
      if (hasScoped || hasRaw) {
        updatedRoles = prev.roles.filter((r) => r !== scopedToken && r !== role);
      } else {
        updatedRoles = [...prev.roles, scopedToken];
      }
      return {
        ...prev,
        roles: updatedRoles,
      };
    });
  };

  // Check if role is selected under a specific department
  const isRoleSelectedInDept = (des: string, role: string) => {
    const scopedToken = `${des}:${role}`;
    if (formData.roles.includes(scopedToken)) return true;
    if (formData.designations.length === 1 && formData.roles.includes(role)) return true;
    return false;
  };

  // Handle Add Submit
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
      if (!token) throw new Error('Authentication required');
      const payload: CreateWhitelistPayload = {
        email: formData.email.trim(),
        userName: formData.userName.trim(),
        provider: formData.provider,
        designations: formData.designations,
        roles: formData.roles,
      };

      const res = await api.createWhitelistedUser(token, payload);
      if (res.success) {
        showToast(`User ${formData.email} successfully whitelisted!`);
        setAddModalOpen(false);
        await refreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to whitelist user';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const res = await api.updateWhitelistedUser(token, userToEdit.id, payload);
      if (res.success) {
        showToast(`Whitelisted member ${userToEdit.email} updated successfully!`);
        setEditModalOpen(false);
        await refreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!userToDelete || !token) return;
    setIsSubmitting(true);

    try {
      const res = await api.deleteWhitelistedUser(token, userToDelete.id);
      if (res.success) {
        showToast(`Member ${userToDelete.email} removed from whitelist`);
        setDeleteModalOpen(false);
        setUserToDelete(null);
        await refreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove user';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditMember = (member: WhitelistedUser) => {
    const isMemberHc =
      member.role === 'ROLE_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command';
      });

    if (isHighCommand) {
      if (isMemberHc && member.id !== currentUser?.id) {
        return false;
      }
      return true;
    }
    if (isMinister) {
      if (member.id === currentUser?.id) return true; // Minister can edit self
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
    const isMemberHc =
      member.role === 'ROLE_HIGH_COMMAND' ||
      member.roles.some((r) => {
        const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
        return pure.toLowerCase() === 'high command';
      });
    if (isMemberHc || member.id === currentUser?.id) return false;
    if (isHighCommand) return true;
    if (isMinister) {
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
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-8 rounded-3xl bg-[#111111]/70 border border-white/10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
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
    <div className="flex flex-col gap-5 w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#141414] border border-emerald-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Personnel Whitelist
                {isHighCommand ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                    High Command Master
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                    {ministerMinistries.length > 0 ? ministerMinistries.join(' & ') : 'Ministry Scoped'}
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-400">
                {isHighCommand
                  ? 'Manage system-wide personnel credentials, designations, and permissions.'
                  : `Scoped access: You may manage personnel strictly within ${ministerMinistries.length > 0 ? ministerMinistries.join(' & ') : 'your assigned ministries'}.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,46,0.3)] transition-all"
          >
            <UserPlus size={15} />
            <span>Whitelist Member</span>
          </button>
        </div>
      </div>

      {/* Notice Banner: First-Login Password Auto-Registration */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/20 via-black/40 to-transparent border border-red-500/20 flex items-start gap-3 backdrop-blur-xl">
        <Info size={18} className="text-red-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold text-white">First-Time Login Password Provisioning:</span>
          <p className="text-zinc-300 leading-relaxed text-[11px]">
            Whitelisted members with <code className="text-red-300 bg-red-500/10 px-1 py-0.5 rounded">EMAIL</code> provider do not require a pre-set password. On their very first login attempt, entering a password will automatically register and BCrypt-hash it into PostgreSQL, then prompt for Discord OAuth2 2FA linking.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#121212]/80 border border-white/[0.08] backdrop-blur-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by email, name, role, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Designation Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 max-w-2xl">
          <button
            onClick={() => setSelectedDesignationFilter('ALL')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedDesignationFilter === 'ALL'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            All ({whitelistedUsers.length})
          </button>
          {Object.keys(hierarchy).map((des) => (
            <button
              key={des}
              onClick={() => setSelectedDesignationFilter(des)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedDesignationFilter === des
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {des}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-[#121212]/80 border border-white/[0.08] backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500 bg-white/[0.02] border-b border-white/5 font-mono">
              <tr>
                <th className="py-3 px-4.5">Personnel Member</th>
                <th className="py-3 px-4.5">Provider</th>
                <th className="py-3 px-4.5">Designations</th>
                <th className="py-3 px-4.5">Roles</th>
                <th className="py-3 px-4.5">Discord 2FA</th>
                <th className="py-3 px-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                    No whitelisted personnel found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((member) => {
                  const avatar = getDiscordAvatarUrl(member.discordId, member.discordAvatar);
                  const isUserHighCommand =
                    member.role === 'ROLE_HIGH_COMMAND' ||
                    member.roles.some((r) => {
                      const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
                      return pure.toLowerCase() === 'high command';
                    });

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-4.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                            <Image
                              src={avatar}
                              alt={member.userName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-white truncate flex items-center gap-2 text-xs">
                              {member.userName}
                              {isUserHighCommand && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                                  HC
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono truncate">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-4.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                          {member.provider}
                        </span>
                      </td>

                      {/* Designations */}
                      <td className="py-3 px-4.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {member.designations.map((d) => (
                            <span
                              key={d}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 border border-red-500/20 font-medium"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4.5">
                        <div className="flex flex-col gap-1 max-w-sm">
                          {member.designations.map((d) => {
                            const deptRoles = member.roles
                              .filter((r) => r.startsWith(`${d}:`) || (!r.includes(':') && (hierarchy[d] || []).includes(r)))
                              .map((r) => (r.startsWith(`${d}:`) ? r.replace(`${d}:`, '') : r));
                            if (deptRoles.length === 0) return null;
                            const deptShort = d.startsWith('Ministry of ') ? d.replace('Ministry of ', '') : d;
                            return (
                              <div key={d} className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 w-fit">
                                <span className="text-zinc-400 font-mono text-[9px]">{deptShort}:</span>
                                <span className="text-white font-medium">{deptRoles.join(', ')}</span>
                              </div>
                            );
                          })}
                          {(() => {
                            const extra = member.roles.filter((r) => {
                              if (r.includes(':')) {
                                const [roleDept] = r.split(':');
                                return !member.designations.includes(roleDept);
                              }
                              const allMatched = member.designations.flatMap((d) => hierarchy[d] || []);
                              return !allMatched.includes(r);
                            });
                            return extra.map((r) => (
                              <span key={r} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10 font-medium w-fit">
                                {r}
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4.5">
                        {member.discordLinked ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                            <CheckCircle2 size={13} />
                            <span>Linked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                            <AlertCircle size={13} />
                            <span>Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditMember(member) && (
                            <button onClick={() => openEditModal(member)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors" title="Edit">
                              <Edit3 size={15} />
                            </button>
                          )}
                          {canDeleteMember(member) && (
                            <button onClick={() => { setUserToDelete(member); setDeleteModalOpen(true); }} className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors" title="Revoke">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredUsers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#111111]/70 border border-white/10 text-center text-zinc-500 text-sm">
            No whitelisted personnel found.
          </div>
        ) : (
          filteredUsers.map((member) => {
            const avatar = getDiscordAvatarUrl(member.discordId, member.discordAvatar);
            const isUserHighCommand =
              member.role === 'ROLE_HIGH_COMMAND' ||
              member.roles.some((r) => {
                const pure = r.includes(':') ? r.substring(r.indexOf(':') + 1).trim() : r.trim();
                return pure.toLowerCase() === 'high command';
              });
            return (
              <div key={member.id} className="p-5 rounded-2xl bg-[#111111]/80 border border-white/10 backdrop-blur-xl flex flex-col gap-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                      <Image src={avatar} alt={member.userName} fill unoptimized className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white text-base truncate flex items-center gap-2">
                        {member.userName}
                        {isUserHighCommand && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono">HC</span>}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono truncate">{member.email}</span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                    {member.provider}
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-zinc-500 font-mono block mb-1.5">Department Roles & Assignments:</span>
                    <div className="flex flex-col gap-1.5">
                      {member.designations.map((d) => {
                        const deptRoles = member.roles
                          .filter((r) => r.startsWith(`${d}:`) || (!r.includes(':') && (hierarchy[d] || []).includes(r)))
                          .map((r) => (r.startsWith(`${d}:`) ? r.replace(`${d}:`, '') : r));
                        return (
                          <div key={d} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[11px] text-red-300 font-medium">{d}</span>
                            <span className="text-[11px] text-zinc-200 font-semibold">{deptRoles.length > 0 ? deptRoles.join(', ') : 'Standard'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  {canEditMember(member) && (
                    <button onClick={() => openEditModal(member)} className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                  {canDeleteMember(member) && (
                    <button onClick={() => { setUserToDelete(member); setDeleteModalOpen(true); }} className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Trash2 size={14} /> Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(addModalOpen || editModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAddModalOpen(false);
                setEditModalOpen(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#111111] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {addModalOpen ? <UserPlus size={20} /> : <Edit3 size={20} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {addModalOpen ? 'Whitelist New Member' : 'Edit Personnel Credentials'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {isHighCommand
                        ? 'High Command Full Privileges'
                        : `Ministry Scoped: ${ministerMinistries.join(' & ')}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form
                onSubmit={addModalOpen ? handleAddSubmit : handleEditSubmit}
                className="mt-6 flex flex-col gap-5"
              >
                {/* Email */}
                {addModalOpen ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. operative@rednecksgaming.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-500 text-sm cursor-not-allowed font-mono"
                    />
                  </div>
                )}

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Full Name / Handle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arzenic"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>

                {/* Provider (Add only) */}
                {addModalOpen && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Authentication Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['EMAIL', 'GOOGLE'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, provider: p })}
                          className={`py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                            formData.provider === p
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(225,29,46,0.2)]'
                              : 'bg-white/[0.02] text-zinc-400 border border-white/5 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Designations Selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Designations * {isHighCommand ? '(2+ Allowed)' : '(Locked to Ministry)'}
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      {formData.designations.length} Selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    {Object.keys(hierarchy).map((des) => {
                      const isSelected = formData.designations.includes(des);
                      const isLockedForMinister = isMinister && !ministerMinistries.includes(des);

                      return (
                        <button
                          key={des}
                          type="button"
                          disabled={isLockedForMinister}
                          onClick={() => handleToggleDesignation(des)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            isSelected
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(225,29,46,0.2)]'
                              : isLockedForMinister
                              ? 'bg-white/[0.01] text-zinc-600 border border-white/5 cursor-not-allowed opacity-40'
                              : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {des}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Roles Selector: Department-Grouped */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Department Roles * {isHighCommand ? '(Configure Per Department)' : '(Ministry Roles)'}
                    </label>
                    <span className="text-[11px] text-zinc-500">{formData.roles.length} Selected</span>
                  </div>

                  {formData.designations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500 italic">
                      Please select at least one Designation above to configure department roles.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                      {formData.designations.map((des) => {
                        const deptRoles = hierarchy[des] || [];
                        const selectedInDept = deptRoles.filter((r) => isRoleSelectedInDept(des, r));
                        const isEditingSelf = Boolean(userToEdit && currentUser && userToEdit.id === currentUser.id);

                        return (
                          <div
                            key={des}
                            className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                              <span className="text-xs font-semibold text-red-300 flex items-center gap-1.5 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {des}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {selectedInDept.length} Selected
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {deptRoles.length === 0 ? (
                                <span className="text-xs text-zinc-500 italic p-1">No roles available.</span>
                              ) : (
                                deptRoles.map((role) => {
                                  const isMinisterSelfLock = Boolean(
                                    isMinister && isEditingSelf && role === 'Minister' && ministerMinistries.includes(des)
                                  );
                                  const isMinisterSubordinateLock = Boolean(
                                    isMinister && !isEditingSelf && (role === 'Minister' || role === 'High Command')
                                  );
                                  const isLocked = isMinisterSubordinateLock || isMinisterSelfLock;
                                  const isSelected = isRoleSelectedInDept(des, role);

                                  return (
                                    <button
                                      key={role}
                                      type="button"
                                      disabled={Boolean(isLocked && isMinisterSubordinateLock)}
                                      onClick={() => handleToggleRoleForDept(des, role)}
                                      title={isMinisterSelfLock ? 'Core Minister role cannot be removed' : undefined}
                                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                                        isSelected
                                          ? isMinisterSelfLock
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)] cursor-not-allowed'
                                            : 'bg-red-500/20 text-white border border-red-500/40 shadow-[0_0_8px_rgba(225,29,46,0.2)]'
                                          : isMinisterSubordinateLock
                                          ? 'bg-white/[0.01] text-zinc-600 border border-white/5 cursor-not-allowed opacity-30'
                                          : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                                      }`}
                                    >
                                      {role} {isMinisterSelfLock && '(Locked)'}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      setEditModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,46,0.35)] transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>{addModalOpen ? 'Save to Whitelist' : 'Update Credentials'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-[#111111] border border-white/10 p-6 md:p-8 shadow-2xl text-center backdrop-blur-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
                <Trash2 size={26} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Revoke Whitelist Access?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Are you sure you want to remove <strong className="text-white">{userToDelete.email}</strong>? They will immediately lose access to all RNG Network systems.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,46,0.35)]"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span>Revoke Member</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
