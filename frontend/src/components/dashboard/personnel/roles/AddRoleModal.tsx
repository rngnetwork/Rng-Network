'use client';

import React, { useState } from 'react';
import { Shield, Plus } from 'lucide-react';
import { Modal, TextInput, Button, Badge } from '@/components/common';

export interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankCode: string;
  rankWeight: number;
  designationId: string;
  designationName: string;
  onAddRole: (rankWeight: number, designationId: string, roleName: string) => void;
}

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  rankCode,
  rankWeight,
  designationId,
  designationName,
  onAddRole,
}) => {
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roleName.trim();
    if (!trimmed) {
      setError('Role name cannot be empty');
      return;
    }
    onAddRole(rankWeight, designationId, trimmed);
    setRoleName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setRoleName('');
        onClose();
      }}
      title="Add Role to Matrix"
      description="Attach a canonical operational role to this specific rank weight and designation."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setError(null);
              setRoleName('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-role-form"
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
          >
            Add Role
          </Button>
        </div>
      }
    >
      <form id="add-role-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 p-2.5 rounded-apple-md bg-white/[0.03] border border-white/[0.08]">
          <Badge variant="crimson" size="md" className="font-mono font-bold">
            {rankCode}
          </Badge>
          <span className="text-xs text-zinc-400">Designation:</span>
          <span className="text-xs font-semibold text-white">{designationName}</span>
        </div>

        <TextInput
          label="Role Name"
          placeholder="e.g. Chancellor of Rivals"
          value={roleName}
          onChange={(e) => {
            setRoleName(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
          leftIcon={<Shield size={16} />}
        />
      </form>
    </Modal>
  );
};
