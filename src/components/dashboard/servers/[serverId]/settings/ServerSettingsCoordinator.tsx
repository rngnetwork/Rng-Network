'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { fetchServerDetails } from '@/lib/api/dashboard/servers/[serverId]';
import {
  fetchServerChannels,
  fetchServerRoles,
  updateServerSettings,
} from '@/lib/api/dashboard/servers/[serverId]/settings';
import type { ServerDetail, UpdateServerSettingsPayload } from '@/lib/model/server';
import type { ChannelItem } from '@/lib/model/channel';
import type { ServerRole } from '@/lib/model/role';
import type { DropdownOption } from '@/components/common/input/Dropdown';
import { Alert } from '@/components/common/feedback/Alert';
import { RngLoadingSpinner } from '@/components/common/feedback/RngLoadingSpinner';
import { GlobalUnsavedChangesBar } from '@/components/dashboard/layout/GlobalUnsavedChangesBar';
import { NitroBoostTierStatus } from './NitroBoostTierStatus';
import { ServerRoleHierarchyList } from './ServerRoleHierarchyList';
import {
  ServerGeneralSettingsForm,
  ServerSettingsFormState,
} from './ServerGeneralSettingsForm';

const AFK_TIMEOUT_OPTIONS: DropdownOption[] = [
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
  { value: '900', label: '15 minutes' },
  { value: '1800', label: '30 minutes' },
  { value: '3600', label: '1 hour' },
];

export const ServerSettingsCoordinator: React.FC = () => {
  const params = useParams();
  const serverId = (params?.serverId as string) || '';

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roles, setRoles] = useState<ServerRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [initialForm, setInitialForm] = useState<ServerSettingsFormState | null>(null);
  const [formData, setFormData] = useState<ServerSettingsFormState>({
    name: '',
    description: '',
    icon: null,
    banner: null,
    afkChannelId: '',
    afkTimeout: 900,
    systemChannelId: '',
    sendWelcome: true,
    stickerPrompt: true,
    boostMessage: true,
    setupTips: false,
    defaultMessageNotifications: 1,
  });

  const [iconUploadError, setIconUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token || !serverId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const [serverRes, channelsRes, rolesRes] = await Promise.allSettled([
          fetchServerDetails(token, serverId),
          fetchServerChannels(token, serverId),
          fetchServerRoles(serverId, token),
        ]);

        if (isMounted) {
          if (
            serverRes.status === 'fulfilled' &&
            serverRes.value.success &&
            serverRes.value.data
          ) {
            const s = serverRes.value.data;
            setServer(s);

            const initial: ServerSettingsFormState = {
              name: s.name || '',
              description: s.description || '',
              icon: s.iconUrl || null,
              banner: s.bannerUrl || null,
              afkChannelId: s.afkChannelId || '',
              afkTimeout: s.afkTimeout != null ? s.afkTimeout : 900,
              systemChannelId: s.systemChannelId || '',
              sendWelcome: s.sendWelcome ?? true,
              stickerPrompt: s.stickerPrompt ?? true,
              boostMessage: s.boostMessage ?? true,
              setupTips: s.setupTips ?? false,
              defaultMessageNotifications:
                s.defaultMessageNotifications != null ? s.defaultMessageNotifications : 1,
            };

            setFormData(initial);
            setInitialForm(initial);
          }

          if (
            channelsRes.status === 'fulfilled' &&
            channelsRes.value.success &&
            channelsRes.value.data
          ) {
            setChannels(channelsRes.value.data);
          }

          if (
            rolesRes.status === 'fulfilled' &&
            rolesRes.value.success &&
            Array.isArray(rolesRes.value.data)
          ) {
            setRoles(rolesRes.value.data);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const voiceChannels = useMemo(
    () => channels.filter((c) => c.type === 2).sort((a, b) => a.position - b.position),
    [channels]
  );

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === 0).sort((a, b) => a.position - b.position),
    [channels]
  );

  const afkChannelOptions: DropdownOption[] = useMemo(
    () => [
      { value: '', label: 'No Inactive Channel' },
      ...voiceChannels.map((c) => ({
        value: c.id,
        label: `🔊 #${c.name}`,
        description: `Voice Channel: ${c.id}`,
      })),
    ],
    [voiceChannels]
  );

  const systemChannelOptions: DropdownOption[] = useMemo(
    () => [
      { value: '', label: 'No System Channel' },
      ...textChannels.map((c) => ({
        value: c.id,
        label: `# ${c.name}`,
        description: `Text Channel: ${c.id}`,
      })),
    ],
    [textChannels]
  );

  const isDirty = useMemo(() => {
    if (!initialForm) return false;
    return (
      formData.name !== initialForm.name ||
      formData.description !== initialForm.description ||
      formData.icon !== initialForm.icon ||
      formData.banner !== initialForm.banner ||
      formData.afkChannelId !== initialForm.afkChannelId ||
      formData.afkTimeout !== initialForm.afkTimeout ||
      formData.systemChannelId !== initialForm.systemChannelId ||
      formData.sendWelcome !== initialForm.sendWelcome ||
      formData.stickerPrompt !== initialForm.stickerPrompt ||
      formData.boostMessage !== initialForm.boostMessage ||
      formData.setupTips !== initialForm.setupTips ||
      formData.defaultMessageNotifications !== initialForm.defaultMessageNotifications
    );
  }, [formData, initialForm]);

  const boostLevel = server?.boostLevel ?? 0;
  const features = useMemo(() => new Set(server?.features || []), [server]);

  const canUploadAnimatedIcon = boostLevel >= 1 || features.has('ANIMATED_ICON');
  const canUploadBanner = boostLevel >= 2 || features.has('BANNER');
  const canUploadAnimatedBanner = boostLevel >= 3 || features.has('ANIMATED_BANNER');

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif && !canUploadAnimatedIcon) {
      setIconUploadError('Animated GIF icons require Server Boost Level 1.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setIconUploadError('Icon must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setFormData((prev) => ({ ...prev, icon: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBannerUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUploadBanner) {
      setBannerUploadError('Server banners require Server Boost Level 2.');
      return;
    }

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif && !canUploadAnimatedBanner) {
      setBannerUploadError('Animated GIF banners require Server Boost Level 3.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBannerUploadError('Banner must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setFormData((prev) => ({ ...prev, banner: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (!initialForm) return;
    setFormData(initialForm);
    setIconUploadError(null);
    setBannerUploadError(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setIsSaving(true);
    setSaveError(null);

    const payload: UpdateServerSettingsPayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      icon: formData.icon?.startsWith('data:')
        ? formData.icon
        : formData.icon === null
        ? null
        : undefined,
      banner: formData.banner?.startsWith('data:')
        ? formData.banner
        : formData.banner === null
        ? null
        : undefined,
      afkChannelId: formData.afkChannelId || null,
      afkTimeout: formData.afkTimeout,
      systemChannelId: formData.systemChannelId || null,
      sendWelcome: formData.sendWelcome,
      stickerPrompt: formData.stickerPrompt,
      boostMessage: formData.boostMessage,
      setupTips: formData.setupTips,
      defaultMessageNotifications: formData.defaultMessageNotifications,
    };

    try {
      const res = await updateServerSettings(token, serverId, payload);
      if (res.success && res.data) {
        const s = res.data;
        setServer(s);

        const newInitial: ServerSettingsFormState = {
          name: s.name || '',
          description: s.description || '',
          icon: s.iconUrl || null,
          banner: s.bannerUrl || null,
          afkChannelId: s.afkChannelId || '',
          afkTimeout: s.afkTimeout != null ? s.afkTimeout : 900,
          systemChannelId: s.systemChannelId || '',
          sendWelcome: s.sendWelcome ?? true,
          stickerPrompt: s.stickerPrompt ?? true,
          boostMessage: s.boostMessage ?? true,
          setupTips: s.setupTips ?? false,
          defaultMessageNotifications:
            s.defaultMessageNotifications != null ? s.defaultMessageNotifications : 1,
        };

        setFormData(newInitial);
        setInitialForm(newInitial);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.message || 'Failed to update server settings.');
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RngLoadingSpinner size="lg" label="Loading Server Preferences..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {saveSuccess && (
        <Alert
          variant="success"
          title="Settings Synchronized"
          description="Server settings saved and synchronized with Discord REST API v10."
        />
      )}
      {saveError && (
        <Alert
          variant="danger"
          title="Update Failed"
          description={saveError}
        />
      )}

      <NitroBoostTierStatus
        boostLevel={server?.boostLevel ?? 0}
        boostCount={server?.boostCount ?? 0}
      />

      <ServerGeneralSettingsForm
        server={server}
        formData={formData}
        onChangeFormData={setFormData}
        afkChannelOptions={afkChannelOptions}
        afkTimeoutOptions={AFK_TIMEOUT_OPTIONS}
        systemChannelOptions={systemChannelOptions}
        canUploadAnimatedIcon={canUploadAnimatedIcon}
        canUploadBanner={canUploadBanner}
        canUploadAnimatedBanner={canUploadAnimatedBanner}
        iconUploadError={iconUploadError}
        bannerUploadError={bannerUploadError}
        onIconUpload={handleIconUpload}
        onBannerUpload={handleBannerUpload}
      />

      <ServerRoleHierarchyList roles={roles} />

      <GlobalUnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={() => void handleSave()}
        onReset={handleReset}
      />
    </div>
  );
};
