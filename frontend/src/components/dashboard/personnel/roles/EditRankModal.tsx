'use client';

import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Modal, TextInput, Button } from '@/components/common';
import type { MatrixRankItem } from '@/lib/api/dashboard/personnel';

export interface EditRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank: MatrixRankItem | null;
  onUpdateRank: (oldWeight: number, newCode: string, newWeight: number) => void;
}

export const EditRankModal: React.FC<EditRankModalProps> = ({
  isOpen,
  onClose,
  rank,
  onUpdateRank,
}) => {
  const [code, setCode] = useState('');
  const [weight, setWeight] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rank) return;
    queueMicrotask(() => {
      setCode(rank.code);
      setWeight(rank.weight);
      setError(null);
    });
  }, [rank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rank) return;
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Rank code is required (e.g. R5)');
      return;
    }
    if (isNaN(weight) || weight < 0) {
      setError('Rank weight must be a positive number');
      return;
    }

    onUpdateRank(rank.weight, trimmedCode, weight);
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
      title="Edit Rank Tier"
      description="Update the canonical rank code and numeric priority weight."
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
            form="edit-rank-form"
            variant="primary"
            size="md"
            leftIcon={<Pencil size={15} />}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form id="edit-rank-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <TextInput
          label="Rank Code"
          placeholder="e.g. R5"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
        />

        <TextInput
          label="Rank Weight (Numeric Value)"
          type="number"
          placeholder="e.g. 5"
          value={String(weight)}
          onChange={(e) => {
            setWeight(parseInt(e.target.value, 10) || 0);
            if (error) setError(null);
          }}
          helperText="Higher weights represent superior command authority."
        />
      </form>
    </Modal>
  );
};
