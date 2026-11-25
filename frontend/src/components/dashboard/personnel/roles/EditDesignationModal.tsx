'use client';

import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Modal, TextInput, Button } from '@/components/common';
import type { MatrixDesignationItem } from '@/lib/api/dashboard/personnel';

export interface EditDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  designation: MatrixDesignationItem | null;
  onUpdateDesignation: (id: string, name: string) => void;
}

export const EditDesignationModal: React.FC<EditDesignationModalProps> = ({
  isOpen,
  onClose,
  designation,
  onUpdateDesignation,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!designation) return;
    queueMicrotask(() => {
      setName(designation.name);
      setError(null);
    });
  }, [designation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Designation title cannot be empty');
      return;
    }
    onUpdateDesignation(designation.id, trimmed);
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
      title="Edit Designation Column"
      description="Update the title for this operational ministry or department designation."
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
            form="edit-designation-form"
            variant="primary"
            size="md"
            leftIcon={<Pencil size={15} />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-designation-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <TextInput
          label="Designation Name"
          placeholder="e.g. Ministry of Tech"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
        />
      </form>
    </Modal>
  );
};
