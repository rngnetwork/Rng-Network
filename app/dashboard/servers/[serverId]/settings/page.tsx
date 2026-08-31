"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Link2,
  MessageSquare,
  Volume2,
  Trash2,
  Radio
} from 'lucide-react';
import { api, ServerDetail, ChannelItem, UpdateServerSettingsPayload } from '@/lib/api';
import { Toggle } from '@/components/ui/Toggle';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';

interface ServerSettingsForm {
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
  vanityUrl: string;
}

const AFK_TIMEOUT_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' }
];

export default function ServerSettingsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerDetail | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [vanityConflictError, setVanityConflictError] = useState<string | null>(null);

  const [initialForm, setInitialForm] = useState<ServerSettingsForm | null>(null);
  const [formData, setFormData] = useState<ServerSettingsForm>({
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
    vanityUrl: ''
  });

  const [iconUploadError, setIconUploadError] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [serverRes, channelsRes] = await Promise.allSettled([
          api.fetchServerDetails(token, serverId),
          api.fetchServerChannels(token, serverId)
        ]);

        if (isMounted) {
          if (serverRes.status === 'fulfilled' && serverRes.value.success && serverRes.value.data) {
            const s = serverRes.value.data;
            setServer(s);

            const initial: ServerSettingsForm = {
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
              defaultMessageNotifications: s.defaultMessageNotifications != null ? s.defaultMessageNotifications : 1,
              vanityUrl: s.vanityUrl || ''
            };

            setFormData(initial);
            setInitialForm(initial);
          }

          if (channelsRes.status === 'fulfilled' && channelsRes.value.success && channelsRes.value.data) {
            setChannels(channelsRes.value.data);
          }
        }
      } catch (err) {
        console.error('Failed to load server data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  const voiceChannels = useMemo(() => {
    return channels.filter(c => c.type === 2).sort((a, b) => a.position - b.position);
  }, [channels]);

  const textChannels = useMemo(() => {
    return channels.filter(c => c.type === 0).sort((a, b) => a.position - b.position);
  }, [channels]);

  // Dirty checking
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
      formData.defaultMessageNotifications !== initialForm.defaultMessageNotifications ||
      formData.vanityUrl !== initialForm.vanityUrl
    );
  }, [formData, initialForm]);

  // Boost levels & feature perks
  const boostLevel = server?.boostLevel ?? 0;
  const features = useMemo(() => new Set(server?.features || []), [server]);

  const canUploadAnimatedIcon = boostLevel >= 1 || features.has('ANIMATED_ICON');
  const canUploadBanner = boostLevel >= 2 || features.has('BANNER');
  const canUploadAnimatedBanner = boostLevel >= 3 || features.has('ANIMATED_BANNER');
  const canUseVanityUrl = boostLevel >= 3 || features.has('VANITY_URL');

  // Handle Logo Upload
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif && !canUploadAnimatedIcon) {
      setIconUploadError('Animated GIF icons require Server Boost Level 1.');
      if (iconInputRef.current) iconInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setIconUploadError('Icon must be under 10MB.');
      if (iconInputRef.current) iconInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setFormData(prev => ({ ...prev, icon: result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBannerUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUploadBanner) {
      setBannerUploadError('Server banners require Server Boost Level 2.');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif && !canUploadAnimatedBanner) {
      setBannerUploadError('Animated GIF banners require Server Boost Level 3.');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBannerUploadError('Banner must be under 10MB.');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setFormData(prev => ({ ...prev, banner: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (!initialForm) return;
    setFormData(initialForm);
    setIconUploadError(null);
    setBannerUploadError(null);
    setVanityConflictError(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return;

    setIsSaving(true);
    setSaveError(null);
    setVanityConflictError(null);

    const payload: UpdateServerSettingsPayload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      icon: formData.icon?.startsWith('data:') ? formData.icon : (formData.icon === null ? null : undefined),
      banner: formData.banner?.startsWith('data:') ? formData.banner : (formData.banner === null ? null : undefined),
      afkChannelId: formData.afkChannelId || null,
      afkTimeout: formData.afkTimeout,
      systemChannelId: formData.systemChannelId || null,
      sendWelcome: formData.sendWelcome,
      stickerPrompt: formData.stickerPrompt,
      boostMessage: formData.boostMessage,
      setupTips: formData.setupTips,
      defaultMessageNotifications: formData.defaultMessageNotifications,
      vanityUrl: canUseVanityUrl && formData.vanityUrl.trim() ? formData.vanityUrl.trim() : null
    };

    try {
      const res = await api.updateServerSettings(token, serverId, payload);
      if (res.success && res.data) {
        const s = res.data;
        setServer(s);

        const newInitial: ServerSettingsForm = {
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
          defaultMessageNotifications: s.defaultMessageNotifications != null ? s.defaultMessageNotifications : 1,
          vanityUrl: s.vanityUrl || ''
        };

        setFormData(newInitial);
        setInitialForm(newInitial);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.message || 'Failed to update server settings.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error saving settings.';
      if (errMsg.toLowerCase().includes('vanity') || errMsg.toLowerCase().includes('already in use') || errMsg.toLowerCase().includes('conflict')) {
        setVanityConflictError(errMsg);
      } else {
        setSaveError(errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
      </div>
    );
  }

  const isAfkActive = Boolean(formData.afkChannelId);
  const isSystemActive = Boolean(formData.systemChannelId);

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>Server settings saved and synchronized with Discord successfully.</span>
          </motion.div>
        )}

        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-300 text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
          >
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{saveError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: SERVER OVERVIEW */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-red-400" />
            Server Overview
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            General Discord server profile, branding assets, and community details.
          </p>
        </div>

        {/* Server Name Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
            Server Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            maxLength={100}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter server name..."
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-red-500 text-white text-sm outline-none transition-all placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(225,29,46,0.25)]"
          />
        </div>

        {/* Server Description Input */}
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
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="A brief description of your server for discovery..."
            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-red-500 text-white text-sm outline-none transition-all placeholder:text-zinc-600 resize-none focus:shadow-[0_0_20px_rgba(225,29,46,0.25)]"
          />
        </div>

        {/* Branding Assets Grid: Icon & Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Server Icon Card */}
          <div className="p-5 rounded-2xl bg-black/30 border border-white/5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase text-zinc-300">
                  Server Icon
                </span>
                {canUploadAnimatedIcon ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                    GIF Unlocked (Level 1)
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                    Static Only
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Recommended size: 512x512px. Accepts PNG, JPEG, or GIF (Level 1+).
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-red-500/30 bg-black shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(225,29,46,0.2)]">
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
                  onChange={handleIconUpload}
                  accept={canUploadAnimatedIcon ? "image/png,image/jpeg,image/webp,image/gif" : "image/png,image/jpeg,image/webp"}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Upload size={14} />
                    <span>Upload Icon</span>
                  </button>
                  {formData.icon && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: null }))}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      title="Remove Icon"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {iconUploadError && (
                  <span className="text-xs text-red-400">{iconUploadError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Server Banner Card */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
            canUploadBanner
              ? 'bg-black/30 border-white/5'
              : 'bg-black/20 border-white/5 opacity-70'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold uppercase text-zinc-300 flex items-center gap-1.5">
                  {!canUploadBanner && <Lock size={12} className="text-amber-400" />}
                  Server Banner
                </span>
                {!canUploadBanner ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                    Requires Boost Level 2
                  </span>
                ) : canUploadAnimatedBanner ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                    Animated GIF (Level 3)
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    Static Only (Level 2)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Recommended size: 960x540px. Displayed at the top of your server channel list.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-28 h-16 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 flex items-center justify-center">
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
                  onChange={handleBannerUpload}
                  disabled={!canUploadBanner}
                  accept={canUploadAnimatedBanner ? "image/png,image/jpeg,image/webp,image/gif" : "image/png,image/jpeg,image/webp"}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canUploadBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      canUploadBanner
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                        : 'bg-zinc-800/40 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {canUploadBanner ? <Upload size={14} /> : <Lock size={14} />}
                    <span>Upload Banner</span>
                  </button>
                  {formData.banner && canUploadBanner && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, banner: null }))}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      title="Remove Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {bannerUploadError && (
                  <span className="text-xs text-red-400">{bannerUploadError}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* SECTION 2: CHANNELS & AUTOMATION (Coupled Dropdowns & Toggles) */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Volume2 size={22} className="text-red-400" />
            Voice & System Channel Automation
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Configure inactivity timeout handling and automated Discord system notifications.
          </p>
        </div>

        {/* AFK / Inactive Channel & Timeout (Coupled) */}
        <div className="p-6 rounded-3xl bg-black/30 border border-white/5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* AFK Channel Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Volume2 size={14} className="text-red-400" />
                Inactive Channel
              </label>
              <select
                value={formData.afkChannelId}
                onChange={e => setFormData(prev => ({ ...prev, afkChannelId: e.target.value }))}
                className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-red-500 text-white text-sm outline-none transition-all cursor-pointer"
              >
                <option value="">No Inactive Channel</option>
                {voiceChannels.map(c => (
                  <option key={c.id} value={c.id}>
                    🔊 #{c.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-500">
                Automatically moves inactive members to this voice channel.
              </span>
            </div>

            {/* AFK Timeout (Disabled if no channel selected) */}
            <div className={`flex flex-col gap-2 transition-opacity ${isAfkActive ? 'opacity-100' : 'opacity-40'}`}>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                Inactive Timeout
              </label>
              <select
                value={formData.afkTimeout}
                disabled={!isAfkActive}
                onChange={e => setFormData(prev => ({ ...prev, afkTimeout: Number(e.target.value) }))}
                className={`w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white text-sm outline-none transition-all ${
                  isAfkActive ? 'focus:border-red-500 cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                {AFK_TIMEOUT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-500">
                {isAfkActive
                  ? "Duration of inactivity before moving to the inactive channel."
                  : "Timeout takes effect when an AFK voice channel is selected."}
              </span>
            </div>
          </div>
        </div>

        {/* System Messages Channel & 4 Notification Toggles (Coupled) */}
        <div className="p-6 rounded-3xl bg-black/30 border border-white/5 flex flex-col gap-5">
          <div className="flex flex-col gap-2 max-w-xl">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <MessageSquare size={14} className="text-red-400" />
              System Messages Channel
            </label>
            <select
              value={formData.systemChannelId}
              onChange={e => setFormData(prev => ({ ...prev, systemChannelId: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-red-500 text-white text-sm outline-none transition-all cursor-pointer"
            >
              <option value="">No System Channel</option>
              {textChannels.map(c => (
                <option key={c.id} value={c.id}>
                  # {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">
              The text channel where Discord posts member events, boost alerts, and setup reminders.
            </span>
          </div>

          {/* 4 Notification Toggles */}
          <div className={`flex flex-col gap-3 mt-2 transition-opacity ${isSystemActive ? 'opacity-100' : 'opacity-40'}`}>
            <div className="text-xs font-mono font-semibold uppercase text-zinc-400 tracking-wider">
              System Notification Events
            </div>

            {!isSystemActive && (
              <span className="text-xs text-amber-400/90 font-mono">
                Select a text channel above to enable system notifications.
              </span>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Send Welcome Message</span>
                  <span className="text-xs text-zinc-400">Welcome message when someone joins</span>
                </div>
                <Toggle
                  checked={formData.sendWelcome}
                  disabled={!isSystemActive}
                  onChange={checked => setFormData(prev => ({ ...prev, sendWelcome: checked }))}
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Sticker Reply Prompts</span>
                  <span className="text-xs text-zinc-400">Prompt members to reply with sticker</span>
                </div>
                <Toggle
                  checked={formData.stickerPrompt}
                  disabled={!isSystemActive}
                  onChange={checked => setFormData(prev => ({ ...prev, stickerPrompt: checked }))}
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Server Boost Alerts</span>
                  <span className="text-xs text-zinc-400">Announce when someone boosts this server</span>
                </div>
                <Toggle
                  checked={formData.boostMessage}
                  disabled={!isSystemActive}
                  onChange={checked => setFormData(prev => ({ ...prev, boostMessage: checked }))}
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Helpful Tips & Guides</span>
                  <span className="text-xs text-zinc-400">Helpful setup tips for community members</span>
                </div>
                <Toggle
                  checked={formData.setupTips}
                  disabled={!isSystemActive}
                  onChange={checked => setFormData(prev => ({ ...prev, setupTips: checked }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* SECTION 3: NOTIFICATION SETTINGS & VANITY URL */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio size={22} className="text-red-400" />
            Default Notifications & Vanity URL
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Global member notification frequency and custom invite URL configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Notifications Radio Selection */}
          <div className="p-6 rounded-3xl bg-black/30 border border-white/5 flex flex-col gap-4">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
              Default Message Notifications
            </label>
            <div className="flex flex-col gap-3">
              <label
                onClick={() => setFormData(prev => ({ ...prev, defaultMessageNotifications: 0 }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  formData.defaultMessageNotifications === 0
                    ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(225,29,46,0.15)]'
                    : 'bg-black/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">All Messages</span>
                  <span className="text-xs text-zinc-400">Members receive pings on every channel message</span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  formData.defaultMessageNotifications === 0 ? 'border-red-500' : 'border-zinc-600'
                }`}>
                  {formData.defaultMessageNotifications === 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                  )}
                </div>
              </label>

              <label
                onClick={() => setFormData(prev => ({ ...prev, defaultMessageNotifications: 1 }))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  formData.defaultMessageNotifications === 1
                    ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(225,29,46,0.15)]'
                    : 'bg-black/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Only @mentions (Recommended)</span>
                  <span className="text-xs text-zinc-400">Members only notified when tagged directly or by role</span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  formData.defaultMessageNotifications === 1 ? 'border-red-500' : 'border-zinc-600'
                }`}>
                  {formData.defaultMessageNotifications === 1 && (
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Vanity URL (Gated to Level 3) */}
          <div className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 transition-all ${
            canUseVanityUrl
              ? 'bg-black/30 border-white/5'
              : 'bg-black/20 border-white/5 opacity-70'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  {!canUseVanityUrl && <Lock size={12} className="text-amber-400" />}
                  Custom Vanity Invite URL
                </label>
                {!canUseVanityUrl ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                    Requires Boost Level 3
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                    Level 3 Unlocked
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Share a personalized invite link for your Discord server.
              </p>

              <div className="flex items-center rounded-2xl bg-black/60 border border-white/10 focus-within:border-red-500 transition-all overflow-hidden">
                <span className="px-3.5 py-3 text-xs font-mono text-zinc-500 bg-white/[0.02] border-r border-white/10 shrink-0">
                  discord.gg/
                </span>
                <input
                  type="text"
                  disabled={!canUseVanityUrl}
                  value={formData.vanityUrl}
                  onChange={e => {
                    setVanityConflictError(null);
                    setFormData(prev => ({ ...prev, vanityUrl: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                  }}
                  placeholder="your-vanity-code"
                  className={`w-full px-4 py-3 bg-transparent text-white text-sm outline-none ${
                    canUseVanityUrl ? '' : 'cursor-not-allowed'
                  }`}
                />
              </div>

              {vanityConflictError && (
                <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{vanityConflictError}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 flex items-center gap-2">
              <Link2 size={14} className="text-red-400 shrink-0" />
              <span>Permanent link alias: <code className="text-zinc-300 font-mono font-semibold">/{server?.slug}</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Unsaved Changes Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  );
}
