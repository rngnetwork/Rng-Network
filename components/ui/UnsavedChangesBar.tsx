"use client";

import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';

interface UnsavedChangesBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  message?: string;
}

const emptySubscribe = () => () => {};

export function UnsavedChangesBar({
  isDirty,
  isSaving,
  onSave,
  onReset,
  message = "Careful — you have unsaved changes!"
}: UnsavedChangesBarProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 100, x: "-50%", opacity: 0, scale: 0.95 }}
          animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="fixed bottom-6 left-1/2 z-[999999] w-[92%] max-w-3xl px-5 py-3.5 md:px-7 md:py-4 rounded-2xl md:rounded-3xl bg-[#111214]/95 border border-red-500/40 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(225,29,46,0.35)] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Status Text with Alert Icon */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_12px_rgba(225,29,46,0.35)]">
              <AlertCircle size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-bold text-white tracking-tight">
                {message}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Don&apos;t forget to save before leaving.
              </span>
            </div>
          </div>

          {/* Action Buttons: Reset & Save */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={onReset}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 focus:outline-none"
            >
              <RotateCcw size={13} className="text-zinc-400" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] text-white font-bold text-xs shadow-[0_0_15px_rgba(225,29,46,0.4)] hover:shadow-[0_0_25px_rgba(225,29,46,0.7)] border border-red-400/30 transition-all flex items-center gap-1.5 focus:outline-none"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={14} />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
