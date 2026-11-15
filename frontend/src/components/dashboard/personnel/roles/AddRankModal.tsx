'use client';

import React, { useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { Modal, TextInput, Button } from '@/components/common';

export interface AddRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRank: (code: string, weight: number, position: 'prepend' | 'append') => void;
}

export const AddRankModal: React.FC<AddRankModalProps> = ({
  isOpen,
  onClose,
  onAddRank,
}) => {
  const [code, setCode] = useState('');
  const [weight, setWeight] = useState('');
  const [position, setPosition] = useState<'prepend' | 'append'>('prepend');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const parsedWeight = parseFloat(weight);

    if (!cleanCode) {
      setError('Rank code is required (e.g. R10)');
      return;
    }
    if (isNaN(parsedWeight)) {
      setError('Rank weight must be a valid number (e.g. 10 or 5.5)');
      return;
    }

    onAddRank(cleanCode, parsedWeight, position);
    setCode('');
    setWeight('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setCode('');
        setWeight('');
        onClose();
      }}
      title="Add Rank Tier Row"
      description="Insert a new authority tier into the vertical rank scale (without extra labels)."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setError(null);
              setCode('');
              setWeight('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-rank-form"
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
          >
            Insert Rank Row
          </Button>
        </div>
      }
    >
      <form id="add-rank-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Rank Code"
            placeholder="e.g. R10"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            leftIcon={<span className="text-brand-red font-mono font-bold text-xs">#</span>}
          />
          <TextInput
            label="Numeric Weight"
            placeholder="e.g. 10"
            type="number"
            step="any"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              if (error) setError(null);
            }}
            leftIcon={<Hash size={16} />}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary select-none">
            Insertion Position
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPosition('prepend')}
              className={`px-3 py-2 rounded-apple-sm text-xs font-semibold border transition-all cursor-pointer ${
                position === 'prepend'
                  ? 'bg-brand-red/15 border-brand-red text-white'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Top (Higher Authority)
            </button>
            <button
              type="button"
              onClick={() => setPosition('append')}
              className={`px-3 py-2 rounded-apple-sm text-xs font-semibold border transition-all cursor-pointer ${
                position === 'append'
                  ? 'bg-brand-red/15 border-brand-red text-white'
                  : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Bottom (Lower Authority)
            </button>
          </div>
        </div>

        {error && <span className="text-xs text-red-400">{error}</span>}
      </form>
    </Modal>
  );
};
