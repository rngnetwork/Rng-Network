'use client';

import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Modal, TextInput, Button } from '@/components/common';

export interface AddDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDesignation: (name: string) => void;
}

export const AddDesignationModal: React.FC<AddDesignationModalProps> = ({
  isOpen,
  onClose,
  onAddDesignation,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Designation name cannot be empty');
      return;
    }
    onAddDesignation(trimmed);
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setName('');
        onClose();
      }}
      title="Add New Designation Column"
      description="Create a new functional department, ministry, or sovereign division in the hierarchy."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setError(null);
              setName('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-designation-form"
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
          >
            Create Designation
          </Button>
        </div>
      }
    >
      <form id="add-designation-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          label="Designation Name"
          placeholder="e.g. Ministry of Intelligence"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
          leftIcon={<Layers size={16} />}
        />
      </form>
    </Modal>
  );
};
