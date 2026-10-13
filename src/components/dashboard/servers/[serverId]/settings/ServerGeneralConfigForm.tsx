'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  Lock,
  FileText,
  Link2,
  MessageSquare,
  Volume2,
  Trash2,
  Radio,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import type { ServerDetail } from '@/lib/model/server';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, DropdownOption } from '@/components/common/input/Dropdown';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { RadioButton } from '@/components/common/input/RadioButton';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';
import { Accordion, AccordionItem } from '@/components/common/navigation/Accordion';
import { Slider } from '@/components/common/input/Slider';
import { Stepper } from '@/components/common/input/Stepper';
import { Tooltip } from '@/components/common/feedback/Tooltip';
import { Carousel } from '@/components/common/containers/Carousel';
import { List, ListItemProps } from '@/components/common/containers/List';
import { Toast } from '@/components/common/feedback/Toast';

export interface ServerSettingsFormState {
  name: string;
  description: string;
  icon: string | null;
  banner: string | null;
  afkChannelId: string;
  afkTimeout: number;
  systemChannelId: string;
  sendWelcome: boolean;
  stickerPrompt: boolean;
  boostMessage: boolean;
  setupTips: boolean;
  defaultMessageNotifications: number;
}

export interface ServerGeneralConfigFormProps {
  server: ServerDetail | null;
  formData: ServerSettingsFormState;
  onChangeFormData: (
    updater: (prev: ServerSettingsFormState) => ServerSettingsFormState
  ) => void;
  afkChannelOptions: DropdownOption[];
  afkTimeoutOptions: DropdownOption[];
  systemChannelOptions: DropdownOption[];
  canUploadAnimatedIcon: boolean;
  canUploadBanner: boolean;
  canUploadAnimatedBanner: boolean;
  iconUploadError: string | null;
  bannerUploadError: string | null;
  onIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ServerGeneralConfigForm: React.FC<ServerGeneralConfigFormProps> = ({
  server,
  formData,
  onChangeFormData,
  afkChannelOptions,
  afkTimeoutOptions,
  systemChannelOptions,
  canUploadAnimatedIcon,
  canUploadBanner,
  canUploadAnimatedBanner,
  iconUploadError,
  bannerUploadError,
  onIconUpload,
  onBannerUpload,
}) => {
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [notificationBatchLimit, setNotificationBatchLimit] = useState(5);
  const [savedToastVisible, setSavedToastVisible] = useState(false);

  const isAfkActive = Boolean(formData.afkChannelId);
  const isSystemActive = Boolean(formData.systemChannelId);

  const bannerPresets = [
    <div key="preset-1" className="h-24 bg-gradient-to-r from-red-950 via-zinc-900 to-black p-4 flex items-center justify-between">
      <span className="text-xs font-mono font-bold text-red-400">Tactical Crimson Banner</span>
      <Badge variant="crimson">Preset 1</Badge>
    </div>,
    <div key="preset-2" className="h-24 bg-gradient-to-r from-zinc-900 via-indigo-950 to-black p-4 flex items-center justify-between">
      <span className="text-xs font-mono font-bold text-indigo-400">Midnight Operations Banner</span>
      <Badge variant="neutral">Preset 2</Badge>
    </div>,
    <div key="preset-3" className="h-24 bg-gradient-to-r from-zinc-950 via-emerald-950 to-black p-4 flex items-center justify-between">
      <span className="text-xs font-mono font-bold text-emerald-400">Fortified Defense Banner</span>
      <Badge variant="success">Preset 3</Badge>
    </div>,
  ];

  const configSummaryItems: ListItemProps[] = [
    {
      id: 'sum-name',
      title: 'Configured Guild Name',
      subtitle: formData.name || 'Unset',
      leading: <FileText size={16} className="text-brand-red" />,
      trailing: <Badge variant="neutral">{formData.name ? 'Active' : 'Pending'}</Badge>,
    },
    {
      id: 'sum-afk',
      title: 'Inactivity Voice Routing',
      subtitle: isAfkActive ? `Timeout: ${formData.afkTimeout}s` : 'Voice AFK Disabled',
      leading: <Volume2 size={16} className="text-amber-400" />,
      trailing: <Badge variant={isAfkActive ? 'success' : 'neutral'}>{isAfkActive ? 'Enabled' : 'Disabled'}</Badge>,
    },
    {
      id: 'sum-sys',
      title: 'Automated System Notifications',
      subtitle: isSystemActive ? 'Welcome & Boost Alerts active' : 'System channel not selected',
      leading: <Sliders size={16} className="text-indigo-400" />,
      trailing: <Badge variant={isSystemActive ? 'crimson' : 'neutral'}>{isSystemActive ? 'Active' : 'Muted'}</Badge>,
    },
  ];

  const accordionItems: AccordionItem[] = [
    {
      id: 'overview',
      title: 'Server Overview & Visual Identity',
      icon: <FileText size={18} className="text-brand-red" />,
      content: (
        <div className="flex flex-col gap-6 pt-3">
          <TextInput
            label="Server Name"
            value={formData.name}
            maxLength={100}
            onChange={(e) =>
              onChangeFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter server name..."
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                Server Description
              </label>
              <span className="text-xs text-zinc-500 font-mono">
                {formData.description.length}/120
              </span>
            </div>
            <textarea
              value={formData.description}
              maxLength={120}
              rows={2}
              onChange={(e) =>
                onChangeFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="A brief description of your server for discovery..."
              className="w-full px-4 py-3 rounded-apple-md bg-zinc-900/80 border border-white/10 focus:border-brand-red text-white text-sm outline-none transition-all placeholder:text-zinc-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-apple-lg bg-black/30 border border-white/[0.08] flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold uppercase text-zinc-300">
                    Server Icon
                  </span>
                  <Badge variant={canUploadAnimatedIcon ? 'crimson' : 'neutral'}>
                    {canUploadAnimatedIcon ? 'GIF Unlocked (Level 1)' : 'Static Only'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  Recommended size: 512x512px. Accepts PNG, JPEG, or GIF (Level 1+).
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-apple-lg overflow-hidden border border-brand-red/30 bg-black shrink-0 flex items-center justify-center shadow-crimson-glow">
                  {formData.icon ? (
                    <Image
                      src={formData.icon}
                      alt="Icon Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">No Icon</span>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <input
                    type="file"
                    ref={iconInputRef}
                    onChange={onIconUpload}
                    accept={
                      canUploadAnimatedIcon
                        ? 'image/png,image/jpeg,image/webp,image/gif'
                        : 'image/png,image/jpeg,image/webp'
                    }
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => iconInputRef.current?.click()}
                      leftIcon={<Upload size={14} />}
                    >
                      Upload Icon
                    </Button>
                    {formData.icon && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          onChangeFormData((prev) => ({ ...prev, icon: null }))
                        }
                        aria-label="Remove Icon"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  {iconUploadError && (
                    <span className="text-xs text-red-400">{iconUploadError}</span>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`p-5 rounded-apple-lg border flex flex-col justify-between gap-4 transition-all ${
                canUploadBanner
                  ? 'bg-black/30 border-white/[0.08]'
                  : 'bg-black/20 border-white/[0.06] opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold uppercase text-zinc-300 flex items-center gap-1.5">
                    {!canUploadBanner && <Lock size={12} className="text-amber-400" />}
                    Server Banner
                  </span>
                  <Tooltip content={canUploadBanner ? 'Nitro Banner unlocked' : 'Requires Discord Server Boost Level 2'}>
                    <Badge
                      variant={
                        !canUploadBanner
                          ? 'warning'
                          : canUploadAnimatedBanner
                          ? 'crimson'
                          : 'neutral'
                      }
                    >
                      {!canUploadBanner
                        ? 'Requires Boost Level 2'
                        : canUploadAnimatedBanner
                        ? 'Animated GIF (Level 3)'
                        : 'Static Only (Level 2)'}
                    </Badge>
                  </Tooltip>
                </div>
                <p className="text-xs text-zinc-400">
                  Recommended size: 960x540px. Displayed at the top of your server channel list.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-28 h-16 rounded-apple-md overflow-hidden border border-white/10 bg-black shrink-0 flex items-center justify-center">
                  {formData.banner ? (
                    <Image
                      src={formData.banner}
                      alt="Banner Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[11px] text-zinc-600 font-mono">No Banner</span>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={onBannerUpload}
                    disabled={!canUploadBanner}
                    accept={
                      canUploadAnimatedBanner
                        ? 'image/png,image/jpeg,image/webp,image/gif'
                        : 'image/png,image/jpeg,image/webp'
                    }
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!canUploadBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      leftIcon={canUploadBanner ? <Upload size={14} /> : <Lock size={14} />}
                    >
                      Upload Banner
                    </Button>
                    {formData.banner && canUploadBanner && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          onChangeFormData((prev) => ({ ...prev, banner: null }))
                        }
                        aria-label="Remove Banner"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  {bannerUploadError && (
                    <span className="text-xs text-red-400">{bannerUploadError}</span>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2 block">
                  Banner Inspiration Showcase:
                </span>
                <Carousel items={bannerPresets} autoPlay={true} interval={4000} />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'automation',
      title: 'Voice & System Channel Automation',
      icon: <Volume2 size={18} className="text-brand-red" />,
      content: (
        <div className="flex flex-col gap-6 pt-3">
          <div className="p-6 rounded-apple-xl bg-black/30 border border-white/[0.08] flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Dropdown
                label="Inactive Voice Channel"
                value={formData.afkChannelId}
                options={afkChannelOptions}
                onChange={(val) =>
                  onChangeFormData((prev) => ({ ...prev, afkChannelId: val }))
                }
                placeholder="Select Inactive Channel..."
                searchable={afkChannelOptions.length > 5}
              />

              <div className={isAfkActive ? 'opacity-100' : 'opacity-40'}>
                <Dropdown
                  label="Inactive Timeout Duration"
                  value={String(formData.afkTimeout)}
                  options={afkTimeoutOptions}
                  disabled={!isAfkActive}
                  onChange={(val) =>
                    onChangeFormData((prev) => ({
                      ...prev,
                      afkTimeout: Number(val),
                    }))
                  }
                  placeholder="Select Inactive Timeout..."
                />
              </div>
            </div>

            {isAfkActive && (
              <div className="pt-3 border-t border-white/[0.06]">
                <Slider
                  label="Fine-tune Inactivity Voice Timeout (Seconds)"
                  min={60}
                  max={3600}
                  step={60}
                  value={formData.afkTimeout}
                  onChange={(val) =>
                    onChangeFormData((prev) => ({ ...prev, afkTimeout: val }))
                  }
                />
              </div>
            )}
          </div>

          <div className="p-6 rounded-apple-xl bg-black/30 border border-white/[0.08] flex flex-col gap-5">
            <div className="max-w-xl">
              <Dropdown
                label="System Messages Channel"
                value={formData.systemChannelId}
                options={systemChannelOptions}
                onChange={(val) =>
                  onChangeFormData((prev) => ({ ...prev, systemChannelId: val }))
                }
                placeholder="Select System Channel..."
                searchable={systemChannelOptions.length > 5}
              />
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${
                isSystemActive ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.06]">
                <ToggleSwitch
                  checked={formData.sendWelcome}
                  disabled={!isSystemActive}
                  onChange={(checked) =>
                    onChangeFormData((prev) => ({ ...prev, sendWelcome: checked }))
                  }
                  label="Send Welcome Message"
                  description="Post welcome message when a member joins"
                />
              </div>

              <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.06]">
                <ToggleSwitch
                  checked={formData.stickerPrompt}
                  disabled={!isSystemActive}
                  onChange={(checked) =>
                    onChangeFormData((prev) => ({
                      ...prev,
                      stickerPrompt: checked,
                    }))
                  }
                  label="Sticker Reply Prompts"
                  description="Prompt members to reply with a sticker"
                />
              </div>

              <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.06]">
                <ToggleSwitch
                  checked={formData.boostMessage}
                  disabled={!isSystemActive}
                  onChange={(checked) =>
                    onChangeFormData((prev) => ({
                      ...prev,
                      boostMessage: checked,
                    }))
                  }
                  label="Server Boost Alerts"
                  description="Announce when someone boosts this server"
                />
              </div>

              <div className="p-4 rounded-apple-lg bg-black/40 border border-white/[0.06]">
                <ToggleSwitch
                  checked={formData.setupTips}
                  disabled={!isSystemActive}
                  onChange={(checked) =>
                    onChangeFormData((prev) => ({ ...prev, setupTips: checked }))
                  }
                  label="Helpful Tips & Guides"
                  description="Helpful setup tips for community members"
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'routing',
      title: 'Default Notifications & Advanced Routing',
      icon: <Radio size={18} className="text-brand-red" />,
      content: (
        <div className="flex flex-col gap-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-apple-xl bg-black/30 border border-white/[0.08] flex flex-col gap-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                Default Message Notifications
              </span>
              <RadioButton
                name="defaultMessageNotifications"
                value="0"
                checked={formData.defaultMessageNotifications === 0}
                onChange={() =>
                  onChangeFormData((prev) => ({
                    ...prev,
                    defaultMessageNotifications: 0,
                  }))
                }
                label="All Messages"
                description="Members receive pings on every channel message"
              />
              <RadioButton
                name="defaultMessageNotifications"
                value="1"
                checked={formData.defaultMessageNotifications === 1}
                onChange={() =>
                  onChangeFormData((prev) => ({
                    ...prev,
                    defaultMessageNotifications: 1,
                  }))
                }
                label="Only @mentions (Recommended)"
                description="Members only notified when tagged directly or by role"
              />

              <div className="pt-3 border-t border-white/[0.06]">
                <Stepper
                  label="Join Notification Batch Throttle (Per Minute)"
                  value={notificationBatchLimit}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(val) => setNotificationBatchLimit(val)}
                />
              </div>
            </div>

            <div className="p-6 rounded-apple-xl bg-black/30 border border-white/[0.08] flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-brand-red" />
                  Permanent Server Slug
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  Unique guild identifier used for deterministic routing in RNG Control Center.
                </p>
              </div>

              <Tooltip content="Canonical URL for server management in RNG Control Center">
                <div className="p-3 rounded-apple-md bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 flex items-center gap-2">
                  <Link2 size={14} className="text-brand-red shrink-0" />
                  <span>
                    Control Center Route:{' '}
                    <code className="text-zinc-200 font-mono font-semibold">
                      /dashboard/servers/{server?.slug || server?.id}
                    </code>
                  </span>
                </div>
              </Tooltip>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => setSavedToastVisible(true)}
                >
                  Verify Configuration
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 mb-3 block">
              Configuration Active Audit Summary:
            </span>
            <List items={configSummaryItems} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {savedToastVisible && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            id="cfg-toast"
            type="success"
            title="Configuration Validated"
            description="Server settings and automation parameters are synchronized."
            onDismiss={() => setSavedToastVisible(false)}
          />
        </div>
      )}

      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText size={22} className="text-brand-red" />
          Server Configuration Hub
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Structured Discord server management powered by RNG Control Center.
        </p>
      </div>

      <Accordion items={accordionItems} defaultOpenId="overview" allowMultiple={true} />
    </div>
  );
};
