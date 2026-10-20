'use client';

import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/input/Button';

export interface GlobalUnsavedChangesBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  message?: string;
}

const emptySubscribe = () => () => {};

export const GlobalUnsavedChangesBar: React.FC<GlobalUnsavedChangesBarProps> = ({
  isDirty,
  isSaving,
  onSave,
  onReset,
  message = 'Careful — you have unsaved changes!',
}) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 100, x: '-50%', opacity: 0, scale: 0.95 }}
          animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
          exit={{ y: 100, x: '-50%', opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          role="region"
          aria-label="Unsaved changes notification bar"
          className="fixed bottom-6 left-1/2 z-[9999] w-[92%] max-w-3xl px-5 py-3.5 md:px-7 md:py-4 rounded-apple-xl bg-zinc-900/95 border border-brand-red/40 backdrop-blur-2xl shadow-apple-modal flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-apple-md bg-brand-red/15 border border-brand-red/35 flex items-center justify-center text-brand-red shrink-0 shadow-crimson-glow">
              <AlertCircle size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-bold text-white tracking-tight">
                {message}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Save or discard your changes before leaving this view.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={onReset}
              leftIcon={<RotateCcw size={13} />}
            >
              Reset
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={onSave}
              leftIcon={<Check size={14} />}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
