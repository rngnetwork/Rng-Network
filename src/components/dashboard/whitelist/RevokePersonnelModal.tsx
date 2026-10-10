'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { WhitelistedUser } from '@/lib/model/whitelist';
import { Modal } from '@/components/common/feedback/Modal';
import { Button } from '@/components/common/input/Button';

export interface RevokePersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: WhitelistedUser | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const RevokePersonnelModal: React.FC<RevokePersonnelModalProps> = ({
  isOpen,
  onClose,
  userToDelete,
  onConfirm,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Whitelist Access?"
      size="sm"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-apple-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Trash2 size={24} />
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Are you sure you want to revoke clearance for{' '}
          <strong className="text-white">{userToDelete?.email}</strong>? They will immediately lose
          access to all RNG Network administrative systems.
        </p>

        <div className="flex items-center justify-center gap-3 w-full pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isSubmitting}
            onClick={onConfirm}
            leftIcon={<Trash2 size={15} />}
            className="flex-1"
          >
            Revoke Member
          </Button>
        </div>
      </div>
    </Modal>
  );
};
