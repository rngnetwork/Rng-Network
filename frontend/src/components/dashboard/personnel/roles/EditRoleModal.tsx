'use client';

import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Modal, TextInput, Button } from '@/components/common';
import type { PopoverRoleItem } from '@/lib/api/dashboard/personnel';

export interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: PopoverRoleItem | null;
  onUpdateRole: (roleId: string, name: string) => void;
}

export const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  role,
  onUpdateRole,
}) => {
  const [roleName, setRoleName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setError(null);
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    const trimmed = roleName.trim();
    if (!trimmed) {
      setError('Role name cannot be empty');
      return;
    }
    onUpdateRole(role.id, trimmed);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Edit Role"
      description="Update the canonical name for this operational role."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setError(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-role-form"
            variant="primary"
            size="md"
            leftIcon={<Pencil size={15} />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-role-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
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
        />
      </form>
    </Modal>
  );
};
