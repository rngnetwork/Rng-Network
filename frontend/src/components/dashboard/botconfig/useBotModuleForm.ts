'use client';

import { useState, useCallback, useMemo } from 'react';
import type { BotModuleValues } from '@/lib/model/bot-module';

export interface UseBotModuleFormOptions {
  initialModules: Record<string, BotModuleValues>;
}

export function useBotModuleForm({ initialModules = {} }: UseBotModuleFormOptions) {
  const [pristineModules, setPristineModules] = useState<Record<string, BotModuleValues>>(
    () => JSON.parse(JSON.stringify(initialModules))
  );
  const [currentModules, setCurrentModules] = useState<Record<string, BotModuleValues>>(
    () => JSON.parse(JSON.stringify(initialModules))
  );
  const [isSaving, setIsSaving] = useState(false);

  const initModules = useCallback((modules: Record<string, BotModuleValues>) => {
    const cloned = JSON.parse(JSON.stringify(modules));
    setPristineModules(cloned);
    setCurrentModules(JSON.parse(JSON.stringify(cloned)));
  }, []);

  const updateField = useCallback(
    (moduleName: string, fieldName: string, value: unknown) => {
      setCurrentModules((prev) => {
        const moduleValues = { ...(prev[moduleName] || {}) };
        moduleValues[fieldName] = value;
        return {
          ...prev,
          [moduleName]: moduleValues,
        };
      });
    },
    []
  );

  const resetModule = useCallback(
    (moduleName: string) => {
      setCurrentModules((prev) => ({
        ...prev,
        [moduleName]: JSON.parse(JSON.stringify(pristineModules[moduleName] || {})),
      }));
    },
    [pristineModules]
  );

  const purgeDirtyStateForModule = useCallback(
    (moduleName: string, newValues: BotModuleValues) => {
      const cloned = JSON.parse(JSON.stringify(newValues));
      setPristineModules((prev) => ({
        ...prev,
        [moduleName]: cloned,
      }));
      setCurrentModules((prev) => ({
        ...prev,
        [moduleName]: JSON.parse(JSON.stringify(cloned)),
      }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setCurrentModules(JSON.parse(JSON.stringify(pristineModules)));
  }, [pristineModules]);

  const commitPristine = useCallback(() => {
    setPristineModules(JSON.parse(JSON.stringify(currentModules)));
  }, [currentModules]);

  const dirtyPayload = useMemo(() => {
    const dirty: Record<string, Record<string, unknown>> = {};

    for (const [moduleName, modValues] of Object.entries(currentModules)) {
      const pristineMod = pristineModules[moduleName] || {};
      const modDiff: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(modValues)) {
        const pristineVal = pristineMod[key];
        const isDifferent =
          typeof val === 'object' && val !== null
            ? JSON.stringify(val) !== JSON.stringify(pristineVal)
            : val !== pristineVal;

        if (isDifferent) {
          modDiff[key] = val;
        }
      }

      if (Object.keys(modDiff).length > 0) {
        dirty[moduleName] = modDiff;
      }
    }

    return dirty;
  }, [currentModules, pristineModules]);

  const isDirty = useMemo(() => Object.keys(dirtyPayload).length > 0, [dirtyPayload]);
  const dirtyCount = useMemo(() => Object.keys(dirtyPayload).length, [dirtyPayload]);

  return {
    currentModules,
    pristineModules,
    initModules,
    updateField,
    resetModule,
    purgeDirtyStateForModule,
    resetAll,
    commitPristine,
    dirtyPayload,
    isDirty,
    dirtyCount,
    isSaving,
    setIsSaving,
  };
}
