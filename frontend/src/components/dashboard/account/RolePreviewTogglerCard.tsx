'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { getStoredAccessToken } from '@/lib/api/core/client';
import { fetchPreviewRoleOptions } from '@/lib/api/dashboard/personnel/perms';
import type { PreviewRoleOption } from '@/lib/model/personnel/perms';
import { useEffectivePermissions } from '@/components/dashboard/layout/EffectivePermissionsContext';
import { Card } from '@/components/common/containers/Card';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';

export const RolePreviewTogglerCard: React.FC = () => {
  const {
    callerMaxRankWeight,
    loading: permsLoading,
    isPreviewMode,
    previewRoleId,
    previewRoleName,
    enterPreviewMode,
    exitPreviewMode,
  } = useEffectivePermissions();

  const [options, setOptions] = useState<PreviewRoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(previewRoleId || '');
  const [hasLoadedOptions, setHasLoadedOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEligible = permsLoading !== true && callerMaxRankWeight >= 8;
  const loadingOptions = isEligible && !hasLoadedOptions;

  useEffect(() => {
    if (!isEligible) return;
    let isMounted = true;
    void (async () => {
      try {
        const token = getStoredAccessToken() || undefined;
        const res = await fetchPreviewRoleOptions(token);
        if (isMounted && res?.success && Array.isArray(res.data)) {
          setOptions(res.data);
          setSelectedRoleId((prev) => prev || previewRoleId || res.data[0]?.roleId || '');
        }
      } catch {
        // Leave options empty if request fails
      } finally {
        if (isMounted) setHasLoadedOptions(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isEligible, previewRoleId]);

  const dropdownOptions = useMemo<DropdownOption<string>[]>(
    () =>
      options.map((opt) => ({
        value: opt.roleId,
        label: `[${opt.rankCode}] ${opt.designationName} — ${opt.roleName}`,
        description: opt.designationName,
      })),
    [options]
  );

  if (!isEligible) {
    return null;
  }

  const handleApplyPreview = async () => {
    if (!selectedRoleId) return;
    setSubmitting(true);
    try {
      await enterPreviewMode(selectedRoleId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitPreview = async () => {
    setSubmitting(true);
    try {
      await exitPreviewMode();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Role Visibility Preview (R9 / R8)"
      subtitle="Temporarily simulate dashboard visibility as any canonical role without modifying your database record"
      headerAction={
        <div className="flex items-center gap-2">
          {isPreviewMode && (
            <Badge variant="warning">
              Previewing: {previewRoleName || previewRoleId}
            </Badge>
          )}
          <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <Eye size={18} />
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Session-Only Simulation · Zero Database Mutation</span>
          <Shield size={14} className="text-brand-red" />
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Dropdown
            options={dropdownOptions}
            value={selectedRoleId}
            onChange={(val) => setSelectedRoleId(val)}
            placeholder={loadingOptions ? 'Loading roles...' : 'Select role to preview'}
            searchable={true}
            disabled={loadingOptions || submitting}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={submitting}
            disabled={!selectedRoleId || loadingOptions}
            leftIcon={<Eye size={15} />}
            onClick={() => void handleApplyPreview()}
          >
            {isPreviewMode ? 'Switch Preview' : 'Preview Role'}
          </Button>

          {isPreviewMode && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={submitting}
              leftIcon={<EyeOff size={15} />}
              onClick={() => void handleExitPreview()}
            >
              Exit Preview
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
