'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PersonnelHierarchyMap, HierarchyRankWeightsMap } from '@/lib/model/whitelist';
import { resolveRoleWeight } from '@/lib/model/whitelist';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import { Alert } from '@/components/common/feedback/Alert';

export interface WhitelistModalFormState {
  email: string;
  userName: string;
  provider: string;
  designations: string[];
  roles: string[];
}

export interface AddPersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AddPersonnelModal: React.FC<AddPersonnelModalProps> = ({
  isOpen,
  onClose,
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
  const effectiveFullAccess = hasFullAccess ?? isHighCommand;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Whitelist New Personnel Member"
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {formError && <Alert variant="danger" title="Validation Error" description={formError} />}

        <TextInput
          label="Email Address"
          type="email"
          required
          placeholder="e.g. operative@rednecksgaming.com"
          value={formData.email}
          onChange={(e) => onChangeFormData((prev) => ({ ...prev, email: e.target.value }))}
        />

        <TextInput
          label="Full Name / Callsign"
          type="text"
          required
          placeholder="e.g. Arzenic"
          value={formData.userName}
          onChange={(e) => onChangeFormData((prev) => ({ ...prev, userName: e.target.value }))}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Authentication Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['EMAIL', 'GOOGLE'].map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => onChangeFormData((prev) => ({ ...prev, provider }))}
                className={`py-2.5 rounded-apple-md text-xs font-mono font-semibold transition-all min-h-[40px] ${
                  formData.provider === provider
                    ? 'bg-brand-red/20 text-red-300 border border-brand-red/40 shadow-crimson-glow'
                    : 'bg-white/[0.02] text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Designations ({effectiveFullAccess ? 'All Ministries' : 'Scoped Designation'})
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

          {formData.designations.length === 0 ? (
            <div className="p-4 rounded-apple-md bg-white/[0.02] border border-white/[0.08] text-center text-xs text-zinc-500 italic">
              Select at least one Designation above to configure department roles.
            </div>
          ) : (
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
                        const isSubordinateLock =
                          typeof operatorRankWeight === 'number'
                            ? operatorRankWeight < 9 &&
                              (roleWeight >= 9 || roleWeight >= Math.max(operatorRankWeight, 1))
                            : Boolean(
                                isMinister &&
                                  (role === 'Minister' ||
                                    role === 'High Command' ||
                                    role === 'Chief High Command' ||
                                    role.toLowerCase().startsWith('chancellor'))
                              );
                        const isSelected = isRoleSelectedInDept(des, role);

                        return (
                          <button
                            key={role}
                            type="button"
                            disabled={isSubordinateLock}
                            onClick={() => onToggleRoleForDept(des, role)}
                            className={`text-xs px-2.5 py-1 rounded-apple-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-brand-red/20 text-white border border-brand-red/40'
                                : isSubordinateLock
                                ? 'bg-white/[0.01] text-zinc-600 border border-white/5 cursor-not-allowed opacity-30'
                                : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            Save to Whitelist
          </Button>
        </div>
      </form>
    </Modal>
  );
};
