'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Type17Container } from '@/lib/model/embed';

export interface HistorySnapshot {
  containers: Type17Container[];
  messageContent: string;
}

export interface UseEmbedHistoryProps {
  containers: Type17Container[];
  messageContent: string;
  onRestoreSnapshot: (snapshot: HistorySnapshot) => void;
  isEnabled?: boolean;
}

export function useEmbedHistory({
  containers,
  messageContent,
  onRestoreSnapshot,
  isEnabled = true,
}: UseEmbedHistoryProps) {
  const cloneSnapshot = (snapshot: HistorySnapshot): HistorySnapshot => ({
    containers: JSON.parse(JSON.stringify(snapshot.containers || [])),
    messageContent: snapshot.messageContent || '',
  });

  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const lastRecordedSnapshotRef = useRef<HistorySnapshot>({
    containers: JSON.parse(JSON.stringify(containers || [])),
    messageContent: messageContent || '',
  });
  const isUndoRedoActiveRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0, hasPending: false });

  useEffect(() => {
    if (!isEnabled) {
      lastRecordedSnapshotRef.current = {
        containers: JSON.parse(JSON.stringify(containers || [])),
        messageContent: messageContent || '',
      };
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (isUndoRedoActiveRef.current) {
      isUndoRedoActiveRef.current = false;
      lastRecordedSnapshotRef.current = {
        containers: JSON.parse(JSON.stringify(containers || [])),
        messageContent: messageContent || '',
      };
      return;
    }

    const currentSerialized = JSON.stringify({ c: containers, m: messageContent });
    const lastSerialized = JSON.stringify({
      c: lastRecordedSnapshotRef.current.containers,
      m: lastRecordedSnapshotRef.current.messageContent,
    });

    if (currentSerialized === lastSerialized) {
      return;
    }

    const lastContainers = lastRecordedSnapshotRef.current.containers;
    const isStructuralChange =
      containers.length !== lastContainers.length ||
      containers.some((c, i) => {
        const lastC = lastContainers[i];
        if (!lastC) return true;
        if ((c.components?.length || 0) !== (lastC.components?.length || 0)) return true;
        if ((c.fields?.length || 0) !== (lastC.fields?.length || 0)) return true;
        if (c.id !== lastC.id) return true;
        return false;
      });

    if (isStructuralChange) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pastRef.current.push(cloneSnapshot(lastRecordedSnapshotRef.current));
      if (pastRef.current.length > 60) {
        pastRef.current.shift();
      }
      futureRef.current = [];
      lastRecordedSnapshotRef.current = {
        containers: JSON.parse(JSON.stringify(containers)),
        messageContent: messageContent || '',
      };
      setHistoryCounts({ past: pastRef.current.length, future: 0, hasPending: false });
    } else {
      setHistoryCounts((prev) => ({ ...prev, hasPending: true }));
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        pastRef.current.push(cloneSnapshot(lastRecordedSnapshotRef.current));
        if (pastRef.current.length > 60) {
          pastRef.current.shift();
        }
        futureRef.current = [];
        lastRecordedSnapshotRef.current = {
          containers: JSON.parse(JSON.stringify(containers)),
          messageContent: messageContent || '',
        };
        debounceTimerRef.current = null;
        setHistoryCounts({ past: pastRef.current.length, future: 0, hasPending: false });
      }, 350);
    }
  }, [containers, messageContent, isEnabled]);

  const undo = useCallback(() => {
    if (!isEnabled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (historyCounts.hasPending) {
      futureRef.current.push({
        containers: JSON.parse(JSON.stringify(containers)),
        messageContent: messageContent || '',
      });
      isUndoRedoActiveRef.current = true;
      const target = cloneSnapshot(lastRecordedSnapshotRef.current);
      onRestoreSnapshot(target);
      setHistoryCounts({
        past: pastRef.current.length,
        future: futureRef.current.length,
        hasPending: false,
      });
      return;
    }

    if (pastRef.current.length === 0) return;

    const previous = pastRef.current.pop()!;
    futureRef.current.push({
      containers: JSON.parse(JSON.stringify(containers)),
      messageContent: messageContent || '',
    });

    isUndoRedoActiveRef.current = true;
    onRestoreSnapshot(cloneSnapshot(previous));
    lastRecordedSnapshotRef.current = cloneSnapshot(previous);
    setHistoryCounts({
      past: pastRef.current.length,
      future: futureRef.current.length,
      hasPending: false,
    });
  }, [containers, messageContent, historyCounts.hasPending, isEnabled, onRestoreSnapshot]);

  const redo = useCallback(() => {
    if (!isEnabled || futureRef.current.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const next = futureRef.current.pop()!;
    pastRef.current.push({
      containers: JSON.parse(JSON.stringify(containers)),
      messageContent: messageContent || '',
    });

    isUndoRedoActiveRef.current = true;
    onRestoreSnapshot(cloneSnapshot(next));
    lastRecordedSnapshotRef.current = cloneSnapshot(next);
    setHistoryCounts({
      past: pastRef.current.length,
      future: futureRef.current.length,
      hasPending: false,
    });
  }, [containers, messageContent, isEnabled, onRestoreSnapshot]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!isEnabled) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdKey) return;

      // Undo: Ctrl+Z / Cmd+Z (without Shift)
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          undo();
        }
      }

      // Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        if (!isInput) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, undo, redo]);

  const canUndo = historyCounts.past > 0 || historyCounts.hasPending;
  const canRedo = historyCounts.future > 0;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
