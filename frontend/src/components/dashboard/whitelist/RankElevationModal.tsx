'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PersonnelHierarchyMap, WhitelistedUser, HierarchyRankWeightsMap } from '@/lib/model/whitelist';
import { resolveRoleWeight } from '@/lib/model/whitelist';
import type { UserProfileData } from '@/lib/model/user';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import { Alert } from '@/components/common/feedback/Alert';
import type { WhitelistModalFormState } from './AddPersonnelModal';

export interface RankElevationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: WhitelistedUser | null;
  currentUser: UserProfileData | null;
  formData: WhitelistModalFormState;
  onChangeFormData: (updater: (prev: WhitelistModalFormState) => WhitelistModalFormState) => void;
  hierarchy: PersonnelHierarchyMap;
  isHighCommand: boolean;
  isMinister: boolean;
  ministerMinistries: string[];
  hasFullAccess?: boolean;
  operatorRankWeight?: number;
  hierarchyWeights?: HierarchyRankWeightsMap;
  onToggleDesignation: (des: string) => void;
  onToggleRoleForDept: (des: string, role: string) => void;
  isRoleSelectedInDept: (des: string, role: string) => boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  formError: string | null;
}

export const RankElevationModal: React.FC<RankElevationModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  currentUser,
  formData,
  onChangeFormData,
  hierarchy,
  isHighCommand,
  isMinister,
  ministerMinistries,
  hasFullAccess,
  operatorRankWeight,
  hierarchyWeights = {},
  onToggleDesignation,
  onToggleRoleForDept,
  isRoleSelectedInDept,
  onSubmit,
  isSubmitting,
  formError,
}) => {
  const isEditingSelf = Boolean(userToEdit && currentUser && userToEdit.id === currentUser.id);
  const effectiveFullAccess = hasFullAccess ?? isHighCommand;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personnel Clearance & Rank"
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {formError && <Alert variant="danger" title="Update Error" description={formError} />}

        <TextInput
          label="Email Address (Locked)"
          type="email"
          disabled
          value={formData.email}
        />

        <TextInput
          label="Full Name / Callsign"
          type="text"
          required
          value={formData.userName}
          onChange={(e) => onChangeFormData((prev) => ({ ...prev, userName: e.target.value }))}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Designations ({effectiveFullAccess ? 'Full Authority' : 'Designation Scoped'})
            </label>
            <span className="text-[11px] text-zinc-500">
              {formData.designations.length} Selected
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-apple-md bg-white/[0.02] border border-white/[0.08]">
            {Object.keys(hierarchy).map((des) => {
              const isSelected = formData.designations.includes(des);
              const isLockedForScoped =
                !effectiveFullAccess &&
                !ministerMinistries.some((m) => m.toLowerCase() === des.toLowerCase());

              return (
                <button
                  key={des}
                  type="button"
                  disabled={isLockedForScoped}
                  onClick={() => onToggleDesignation(des)}
                  className={`text-xs px-3 py-1.5 rounded-apple-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-red/20 text-red-300 border border-brand-red/40'
                      : isLockedForScoped
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Department Roles
            </label>
            <span className="text-[11px] text-zinc-500">{formData.roles.length} Selected</span>
          </div>

          <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1">
            {formData.designations.map((des) => {
              const deptRoles = hierarchy[des] || [];
              return (
                <div
                  key={des}
                  className="p-3 rounded-apple-md bg-white/[0.02] border border-white/10 flex flex-col gap-2"
                >
                  <span className="text-xs font-semibold text-red-300 font-mono">{des}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {deptRoles.map((role) => {
                      const roleWeight = resolveRoleWeight(des, role, hierarchyWeights);
                      const isSelected = isRoleSelectedInDept(des, role);
                      const isOriginallyAssignedOnSelf =
                        isEditingSelf &&
                        Boolean(
                          userToEdit?.roles?.some((r) => {
                            const trimmed = r.trim().toLowerCase();
                            if (trimmed.includes(':')) {
                              return trimmed === `${des}:${role}`.trim().toLowerCase();
                            }
                            return (
                              (userToEdit?.designations?.length ?? 0) <= 1 &&
                              trimmed === role.trim().toLowerCase()
                            );
                          })
                        );
                      const isMinisterSelfLock = Boolean(
                        isMinister &&
                          isEditingSelf &&
                          role === 'Minister' &&
                          ministerMinistries.some((m) => m.toLowerCase() === des.toLowerCase())
                      );
                      const effectiveOpWeight = Math.max(operatorRankWeight ?? 0, 1);
                      const isSubordinateLock =
                        typeof operatorRankWeight === 'number'
                          ? operatorRankWeight < 9 &&
                            (roleWeight >= 9 ||
                              (isEditingSelf
                                ? roleWeight > effectiveOpWeight ||
                                  (!isOriginallyAssignedOnSelf &&
                                    !isSelected &&
                                    roleWeight >= effectiveOpWeight)
                                : roleWeight >= effectiveOpWeight))
                          : Boolean(
                              isMinister &&
                                !isEditingSelf &&
                                (role === 'Minister' || role === 'High Command')
                            );

                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={isSubordinateLock}
                          onClick={() => onToggleRoleForDept(des, role)}
                          className={`text-xs px-2.5 py-1 rounded-apple-sm font-medium transition-all ${
                            isSelected
                              ? isMinisterSelfLock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                                : 'bg-brand-red/20 text-white border border-brand-red/40'
                              : isSubordinateLock
                              ? 'bg-white/[0.01] text-zinc-600 border border-white/5 cursor-not-allowed opacity-30'
                              : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {role} {isMinisterSelfLock ? '(Locked)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 size={16} />}
          >
            Update Credentials
          </Button>
        </div>
      </form>
    </Modal>
  );
};
