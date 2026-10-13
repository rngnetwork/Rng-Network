'use client';

import React from 'react';
import { AlertCircle, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/common/input/Button';

export interface UnsavedChangesBarProps {
  isDirty: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onReset: () => void;
  message?: string;
}

export const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  isDirty,
  isSaving = false,
  onSave,
  onReset,
  message = 'Careful — you have unsaved changes in Message Builder!',
}) => {
  if (!isDirty) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] bg-zinc-900/95 border border-brand-red/40 backdrop-blur-md px-4 py-2.5 rounded-apple-xl flex flex-wrap items-center justify-between gap-3 shadow-apple-elevated animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle size={16} className="text-brand-red shrink-0" />
        <span className="text-xs font-semibold text-white">
          {message}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw size={13} />}
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={isSaving}
          leftIcon={<Save size={13} />}
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
