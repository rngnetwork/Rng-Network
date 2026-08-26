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
  Sparkles,
  Terminal,
  FileText,
  Bell,
  ShieldAlert,
  Link2,
  MessageSquare,
  Volume2,
  Palette,
  Ban,
  Tag,
  Radio,
  X,
  Trash2,
  Smile,
  Search
} from 'lucide-react';
import { mockServersApi, ServerData, ServerTrait } from '@/lib/mockServersApi';
import { Toggle } from '@/components/ui/Toggle';
import { UnsavedChangesBar } from '@/components/ui/UnsavedChangesBar';

interface ServerSettingsState {
  serverName: string;
  prefix: string;
  locale: string;
  description: string;
  logoPreview: string;
  bannerPreview: string;
  bannerColor: string;
  afkChannel: string;
  afkTimeout: string;
  systemChannel: string;
  sendWelcome: boolean;
  stickerPrompt: boolean;
  boostMessage: boolean;
  setupTips: boolean;
  notificationLevel: string;
  verificationLevel: string;
  mediaFilter: string;
  vanityUrl: string;
  traits: ServerTrait[];
  activityFeedEnabled: boolean;
}

const PRESET_BANNER_COLORS = [
  { id: 'none', label: 'Default / Banner Image', hex: 'none' },
  { id: 'blurple', label: 'Discord Blurple', hex: '#5865F2' },
  { id: 'green', label: 'Discord Green', hex: '#57F287' },
  { id: 'yellow', label: 'Discord Yellow', hex: '#FEE75C' },
  { id: 'pink', label: 'Discord Fuchsia', hex: '#EB459E' },
  { id: 'red', label: 'Discord Red', hex: '#ED4245' },
  { id: 'dark', label: 'Discord Dark', hex: '#2B2D31' },
  { id: 'teal', label: 'Discord Teal', hex: '#1ABC9C' },
  { id: 'orange', label: 'Discord Orange', hex: '#E67E22' },
  { id: 'purple', label: 'Discord Purple', hex: '#9B59B6' },
  { id: 'navy', label: 'Discord Navy', hex: '#4E5D94' }
];

const EMOJI_CATEGORIES = [
  {
    name: 'Custom Server Emojis',
    emojis: ['👑', '🔥', '⚔️', '🛡️', '💎', '🚀', '👾', '🏆', '⚡', '🎯', '💀', '🍿', '🔴', '🤖', '✨', '🗡️']
  },
  {
    name: 'Gaming & Activities',
    emojis: ['🎮', '🕹️', '🎲', '🎧', '💻', '🥊', '🏹', '🥇', '🎪', '🎤', '🎳', '🏎️', '⚽', '🏀', '🎱', '🧩']
  },
  {
    name: 'Smileys & Community',
    emojis: ['😊', '😎', '🤝', '💬', '☕', '🎉', '🌟', '❤️', '🍕', '💡', '👀', '🤙', '💯', '👋', '🥳', '🔥']
  }
];

const TRAIT_PLACEHOLDERS = [
  'Gaming Hub',
  'Esports & Tournaments',
  'Casual Hangouts',
  'Voice Chats',
  'Events & Giveaways'
];

export default function ServerSettingsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial and current states for dirty checking
  const [initialState, setInitialState] = useState<ServerSettingsState | null>(null);
  const [formData, setFormData] = useState<ServerSettingsState>({
    serverName: '',
    prefix: '!',
    locale: 'English (US) — en-US',
    description: '',
    logoPreview: '',
    bannerPreview: '',
    bannerColor: 'none',
    afkChannel: '🔊 #afk-lounge',
    afkTimeout: '15 minutes',
    systemChannel: '#welcome',
    sendWelcome: true,
    stickerPrompt: true,
    boostMessage: true,
    setupTips: false,
    notificationLevel: 'Only @mentions (Recommended for large communities)',
    verificationLevel: 'High — Must be a member of this server for longer than 10 minutes',
    mediaFilter: 'Scan media content from all members (Recommended)',
    vanityUrl: 'rng-network',
    traits: [
      { emoji: '', name: '' },
      { emoji: '', name: '' },
      { emoji: '', name: '' },
      { emoji: '', name: '' },
      { emoji: '', name: '' }
    ],
    activityFeedEnabled: true
  });

  // Emoji Picker Popover state for 5 Traits
  const [activeEmojiSlot, setActiveEmojiSlot] = useState<number | null>(null);
  const [emojiSearch, setEmojiSearch] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Toast & Saving states
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadServer = async () => {
      try {
        const found = await mockServersApi.getServerById(serverId);
        if (isMounted && found) {
          setServer(found);
          const rawTraits = found.traits || [];
          const normalizedTraits: ServerTrait[] = Array.from({ length: 5 }, (_, i) => {
            if (rawTraits[i]) {
              return {
                emoji: rawTraits[i].emoji || '😊',
                name: rawTraits[i].name || ''
              };
            }
            return { emoji: '', name: '' };
          });

          const state: ServerSettingsState = {
            serverName: found.name,
            prefix: found.prefix || '!',
            locale: found.locale || 'English (US) — en-US',
            description: found.description || '',
            logoPreview: found.icon || '',
            bannerPreview: found.banner || '',
            bannerColor: found.bannerColor || (found.banner ? 'none' : 'none'),
            afkChannel: found.afkChannel || '🔊 #afk-lounge',
            afkTimeout: found.afkTimeout || '15 minutes',
            systemChannel: found.welcomeChannel || '#welcome',
            sendWelcome: true,
            stickerPrompt: true,
            boostMessage: true,
            setupTips: false,
            notificationLevel: 'Only @mentions (Recommended for large communities)',
            verificationLevel: 'High — Must be a member of this server for longer than 10 minutes',
            mediaFilter: 'Scan media content from all members (Recommended)',
            vanityUrl: found.shortName.toLowerCase() || 'rng-network',
            traits: normalizedTraits,
            activityFeedEnabled: found.activityFeedEnabled ?? true
          };
          setFormData(state);
          setInitialState(state);
        }
      } catch (err) {
        console.error('Failed to load server settings:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadServer();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  // Compute if any field is dirty (changed from initial server data)
  const isDirty = useMemo(() => {
    if (!initialState) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialState);
  }, [formData, initialState]);

  // Compute server acronym/initials from first words for icon placeholder
  const serverInitials = useMemo(() => {
    const name = formData.serverName || server?.name || '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return server?.shortName || 'RG';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  }, [formData.serverName, server]);

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Handle Logo Upload with GIF Boost Level Check
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !server) return;

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

    // GIF requires Boost Level 2+
    if (isGif && server.boostLevel < 2) {
      showToast(
        'error',
        `Animated GIF icons require Server Boost Level 2. Your server is currently at Level ${server.boostLevel} (${server.boostCount} Boosts).`
      );
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, logoPreview: objectUrl }));
  };

  // Handle Banner Upload with GIF Boost Level Check
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !server) return;

    if (server.boostLevel < 2) {
      showToast('error', `Server Banner requires Server Boost Level 2. Current: Level ${server.boostLevel}.`);
      return;
    }

    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
    if (isGif && server.boostLevel < 3) {
      showToast(
        'error',
        `Animated GIF banners require Server Boost Level 3. Your server is currently at Level ${server.boostLevel}.`
      );
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, bannerPreview: objectUrl }));
  };

  // Trait field handlers
  const handleTraitChange = (index: number, field: 'emoji' | 'name', value: string) => {
    setFormData((prev) => {
      const updated = [...prev.traits];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, traits: updated };
    });
  };

  const handleClearTrait = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.traits];
      updated[index] = { emoji: '', name: '' };
      return { ...prev, traits: updated };
    });
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setActiveEmojiSlot(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset Changes (Silently reverts without toast)
  const handleReset = () => {
    if (initialState) {
      setFormData({ ...initialState });
      setActiveEmojiSlot(null);
    }
  };

  // Save Changes
  const handleSave = async () => {
    if (!server) return;
    setIsSaving(true);
    try {
      const cleanedTraits = formData.traits.filter(
        (t) => t.name.trim() !== '' || (t.emoji && t.emoji.trim() !== '')
      );
      await mockServersApi.updateServerSettings(server.id, {
        name: formData.serverName,
        icon: formData.logoPreview,
        banner: formData.bannerPreview,
        bannerColor: formData.bannerColor,
        description: formData.description,
        prefix: formData.prefix,
        locale: formData.locale,
        welcomeChannel: formData.systemChannel,
        afkChannel: formData.afkChannel,
        afkTimeout: formData.afkTimeout,
        traits: cleanedTraits,
        activityFeedEnabled: formData.activityFeedEnabled
      });
      setInitialState({ ...formData });
      showToast('success', 'Server settings saved and synchronized with Discord Bot!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      showToast('error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-3 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!server) return null;

  const isBannerLocked = server.boostLevel < 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8 w-full pb-20"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl text-white shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl border ${
              toast.type === 'error'
                ? 'bg-[#18080a]/95 border-red-500/40 shadow-[0_0_25px_rgba(225,29,46,0.35)]'
                : 'bg-[#0a180f]/95 border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.25)]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={20} className="text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            )}
            <span className="text-xs md:text-sm font-medium leading-relaxed max-w-md">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleBannerUpload}
      />

      {/* ========================================================================= */}
      {/* SECTION 1: Server Overview & Identity (Logo, Banner & Color Chooser)      */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            Server Overview & Identity
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Basic server profile details, icon, banner image, static accent color, and locale.
          </p>
        </div>

        {/* Branding Row: Logo Uploader + Banner Image & Color Chooser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-white/5">
          {/* 1. Logo Upload */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles size={14} className="text-red-400" />
              Server Icon
            </span>

            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-red-500/40 bg-gradient-to-br from-[#18181b] via-[#101012] to-black shadow-[0_0_20px_rgba(225,29,46,0.25)] shrink-0 flex items-center justify-center">
                {formData.logoPreview ? (
                  <Image
                    src={formData.logoPreview}
                    alt="Server Logo"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-white font-mono tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    {serverInitials}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-white">Custom Server Icon</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Supported formats: PNG, JPG, WEBP, GIF (Level 2 Boost required for GIF).
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-fit px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,46,0.15)]"
                  >
                    <Upload size={13} className="text-red-400" />
                    <span>Upload Image</span>
                  </button>

                  {formData.logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, logoPreview: '' }));
                        if (logoInputRef.current) logoInputRef.current.value = '';
                      }}
                      className="w-fit px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300 hover:text-red-200 flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={13} className="text-red-400" />
                      <span>Remove Icon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Banner Background (Image + Static Colour Chooser) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={14} className="text-red-400" />
                Server Banner & Accent Color
              </span>
              <span
                className={`text-[10.5px] px-2 py-0.5 rounded-md font-mono ${
                  isBannerLocked
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isBannerLocked ? 'Image: Level 2 Required' : 'Level 2 Image Active'}
              </span>
            </div>

            {/* Banner Preview (Cleanly renders either custom image or chosen static color) */}
            <div
              className="relative w-full h-28 md:h-32 rounded-2xl overflow-hidden border-2 border-red-500/30 flex items-center justify-center transition-colors duration-200"
              style={{
                backgroundColor: formData.bannerColor !== 'none' ? formData.bannerColor : '#0a0a0a'
              }}
            >
              {!isBannerLocked && formData.bannerPreview && formData.bannerColor === 'none' ? (
                <Image
                  src={formData.bannerPreview}
                  alt="Server Banner Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                /* Static Solid Color Banner with Monogram */
                <div
                  className="w-full h-full flex items-center justify-between p-4"
                  style={{
                    background:
                      formData.bannerColor !== 'none'
                        ? `linear-gradient(135deg, ${formData.bannerColor} 0%, rgba(10,10,10,0.85) 100%)`
                        : 'linear-gradient(135deg, #18181b 0%, #09090b 100%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-white font-bold text-sm font-mono">
                      {server.shortName}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white tracking-tight">{formData.serverName || server.name}</span>
                      <span className="text-[10px] text-zinc-300 font-mono">
                        {formData.bannerColor !== 'none' ? 'Static Banner Color' : 'Default Theme'}
                      </span>
                    </div>
                  </div>

                  {isBannerLocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/50 text-zinc-300 border border-white/10 font-mono flex items-center gap-1">
                      <Lock size={10} className="text-red-400" />
                      Image Locked
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Static Banner Color Chooser (Block button + Predefined static swatches) */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                  <Palette size={13} className="text-red-400" />
                  Banner Color Swatches
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {PRESET_BANNER_COLORS.find(
                    (c) => c.hex.toLowerCase() === formData.bannerColor.toLowerCase()
                  )?.label || 'RNG Crimson Red'}
                </span>
              </div>

              {/* Block Icon Button + Predefined Discord Static Color Swatches */}
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_BANNER_COLORS.map((col) => {
                  const isSelected = formData.bannerColor.toLowerCase() === col.hex.toLowerCase();
                  const isNone = col.hex === 'none';

                  if (isNone) {
                    return (
                      <button
                        key={col.id}
                        type="button"
                        title={col.label}
                        onClick={() => setFormData((prev) => ({ ...prev, bannerColor: 'none' }))}
                        className={`w-7 h-7 rounded-xl transition-all duration-150 relative flex items-center justify-center bg-white/5 border ${
                          isSelected
                            ? 'scale-110 border-red-500 ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.6)] z-10 text-red-400'
                            : 'border-white/10 hover:scale-105 opacity-75 hover:opacity-100 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Ban size={14} />
                      </button>
                    );
                  }

                  return (
                    <button
                      key={col.id}
                      type="button"
                      title={col.label}
                      onClick={() => setFormData((prev) => ({ ...prev, bannerColor: col.hex }))}
                      className={`w-7 h-7 rounded-xl transition-all duration-150 relative flex items-center justify-center ${
                        isSelected
                          ? 'scale-110 ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.6)] z-10'
                          : 'hover:scale-105 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Banner Image Upload Button */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400 font-mono">
                {isBannerLocked ? 'Requires Level 2 Boost for Custom Image' : '16:9 Aspect Ratio (1920x1080)'}
              </span>

              <button
                type="button"
                disabled={isBannerLocked}
                onClick={() => bannerInputRef.current?.click()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isBannerLocked
                    ? 'bg-zinc-800/50 text-zinc-500 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-zinc-200 hover:text-white shadow-[0_0_15px_rgba(225,29,46,0.15)]'
                }`}
              >
                {isBannerLocked ? <Lock size={13} /> : <Upload size={13} className="text-red-400" />}
                <span>{formData.bannerPreview && !isBannerLocked ? 'Change Banner' : 'Upload Banner'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inputs: Name, Prefix, Locale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Server Name</label>
            <input
              type="text"
              value={formData.serverName}
              onChange={(e) => setFormData((prev) => ({ ...prev, serverName: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Terminal size={13} className="text-red-400" />
              Bot Command Prefix
            </label>
            <input
              type="text"
              maxLength={3}
              value={formData.prefix}
              onChange={(e) => setFormData((prev) => ({ ...prev, prefix: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Server Preferred Locale</label>
            <select
              value={formData.locale}
              onChange={(e) => setFormData((prev) => ({ ...prev, locale: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="English (US) — en-US">English (US) — en-US</option>
              <option value="English (UK) — en-GB">English (UK) — en-GB</option>
              <option value="Español — es-ES">Español — es-ES</option>
              <option value="Français — fr-FR">Français — fr-FR</option>
              <option value="Deutsch — de-DE">Deutsch — de-DE</option>
              <option value="日本語 — ja-JP">日本語 — ja-JP</option>
            </select>
          </div>
        </div>

        {/* Server Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <FileText size={13} className="text-red-400" />
            Server Description
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Traits (5 Customizable Slots with Emoji Picker)                */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Tag size={18} className="text-red-400" />
              Traits
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add up to 5 traits to show off your server&apos;s interests and personality.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 w-fit">
            <span className="text-red-400 font-bold">
              {formData.traits.filter((t) => t.name.trim() !== '').length}
            </span>{' '}
            / 5 Selected
          </span>
        </div>

        {/* 5 Trait Slots Grid Matching Discord's exact layout from test.jpg */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, index) => {
            const trait = formData.traits[index] || { emoji: '', name: '' };
            const isPickerOpen = activeEmojiSlot === index;

            return (
              <div
                key={index}
                className={`relative flex items-center bg-white/[0.03] hover:bg-white/[0.05] border ${
                  isPickerOpen ? 'border-red-500 shadow-[0_0_15px_rgba(225,29,46,0.25)]' : 'border-white/10'
                } rounded-2xl p-2 transition-all duration-150 ${
                  index === 4 ? 'md:col-span-2 md:max-w-[calc(50%-0.5rem)]' : ''
                }`}
              >
                {/* Emoji Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveEmojiSlot(isPickerOpen ? null : index);
                    setEmojiSearch('');
                  }}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 flex items-center justify-center text-lg shrink-0 transition-all active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                  title="Choose Emoji"
                >
                  {trait.emoji ? (
                    <span className="text-lg leading-none">{trait.emoji}</span>
                  ) : (
                    <Smile size={18} className="text-zinc-400 hover:text-red-400 transition-colors" />
                  )}
                </button>

                {/* Trait Text Input */}
                <input
                  type="text"
                  maxLength={32}
                  placeholder={TRAIT_PLACEHOLDERS[index] || `Trait ${index + 1}`}
                  value={trait.name}
                  onChange={(e) => handleTraitChange(index, 'name', e.target.value)}
                  className="flex-1 bg-transparent px-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
                />

                {/* Clear Button if filled */}
                {(trait.name || trait.emoji) && (
                  <button
                    type="button"
                    onClick={() => handleClearTrait(index)}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                    title="Clear slot"
                  >
                    <X size={13} />
                  </button>
                )}

                {/* Floating Emoji Picker Popover */}
                <AnimatePresence>
                  {isPickerOpen && (
                    <motion.div
                      ref={emojiPickerRef}
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 w-80 p-3.5 rounded-2xl bg-[#141416] border border-red-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(225,29,46,0.2)] z-50 flex flex-col gap-3 backdrop-blur-2xl"
                    >
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search emoji..."
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                        <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
                      </div>

                      {/* Emoji Categories & Grids */}
                      <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                        {EMOJI_CATEGORIES.map((cat) => {
                          const filtered = cat.emojis.filter((em) =>
                            emojiSearch.trim()
                              ? em.includes(emojiSearch.trim()) ||
                                cat.name.toLowerCase().includes(emojiSearch.toLowerCase())
                              : true
                          );
                          if (filtered.length === 0) return null;

                          return (
                            <div key={cat.name} className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
                                {cat.name}
                              </span>
                              <div className="grid grid-cols-8 gap-1">
                                {filtered.map((emoji, eIdx) => (
                                  <button
                                    key={eIdx}
                                    type="button"
                                    onClick={() => {
                                      handleTraitChange(index, 'emoji', emoji);
                                      setActiveEmojiSlot(null);
                                    }}
                                    className={`w-8 h-8 rounded-lg hover:bg-red-500/20 hover:scale-110 flex items-center justify-center text-base transition-all ${
                                      trait.emoji === emoji
                                        ? 'bg-red-500/30 border border-red-500/50'
                                        : 'bg-white/[0.02]'
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Clear Emoji Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                        <span className="text-zinc-400 font-mono">Slot {index + 1}</span>
                        {trait.emoji && (
                          <button
                            type="button"
                            onClick={() => {
                              handleTraitChange(index, 'emoji', '');
                              setActiveEmojiSlot(null);
                            }}
                            className="text-red-400 hover:text-red-300 font-semibold"
                          >
                            Remove Emoji
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Activity Feed Settings                                         */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Radio size={18} className="text-red-400" />
            Activity Feed Settings
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Shows a feed of activity from games and connected apps in this server.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 max-w-2xl">
          <Toggle
            checked={formData.activityFeedEnabled}
            onChange={(val) => setFormData((prev) => ({ ...prev, activityFeedEnabled: val }))}
            label="Display activity feed in this server"
            description="Allow members to view recent games and rich presence activity happening in this server."
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Inactive Channel & AFK Timeout                                 */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Volume2 size={18} className="text-red-400" />
            Inactive Channel & AFK Timeout
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automatically move inactive voice members to a specific channel after a period of time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Inactive Channel (AFK)</label>
            <select
              value={formData.afkChannel}
              onChange={(e) => setFormData((prev) => ({ ...prev, afkChannel: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="No Inactive Channel">No Inactive Channel</option>
              <option value="🔊 #afk-lounge">🔊 #afk-lounge</option>
              <option value="🔊 #voice-inactive">🔊 #voice-inactive</option>
              <option value="🔊 #lounge">🔊 #lounge</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Inactive Timeout</label>
            <select
              value={formData.afkTimeout}
              onChange={(e) => setFormData((prev) => ({ ...prev, afkTimeout: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="1 minute">1 minute</option>
              <option value="5 minutes">5 minutes</option>
              <option value="15 minutes">15 minutes</option>
              <option value="30 minutes">30 minutes</option>
              <option value="1 hour">1 hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: System Messages Channel & Event Messages                       */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-red-400" />
            System Messages Channel & Event Messages
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure automated join announcements, boost alerts, and server notifications.
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-md">
          <label className="text-xs font-semibold text-zinc-300">System Messages Channel</label>
          <select
            value={formData.systemChannel}
            onChange={(e) => setFormData((prev) => ({ ...prev, systemChannel: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-red-500/50 transition-colors"
          >
            <option value="#welcome">#welcome</option>
            <option value="#announcements">#announcements</option>
            <option value="#lounge">#lounge</option>
            <option value="#general">#general</option>
            <option value="none">No System Messages Channel</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={formData.sendWelcome}
              onChange={(val) => setFormData((prev) => ({ ...prev, sendWelcome: val }))}
              label="Random Welcome Messages"
              description="Send a welcome message when someone joins this server"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={formData.stickerPrompt}
              onChange={(val) => setFormData((prev) => ({ ...prev, stickerPrompt: val }))}
              label="Sticker Reply Prompt"
              description="Prompt members to reply to welcome messages with a sticker"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={formData.boostMessage}
              onChange={(val) => setFormData((prev) => ({ ...prev, boostMessage: val }))}
              label="Server Boost Announcements"
              description="Send a message when someone boosts this server"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={formData.setupTips}
              onChange={(val) => setFormData((prev) => ({ ...prev, setupTips: val }))}
              label="Helpful Setup Tips"
              description="Send helpful tips for server configuration and bot usage"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Default Notification Settings                                  */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <Bell size={18} className="text-red-400" />
            Default Notification Settings
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Default notification frequency applied to newly joined members.
          </p>
        </div>

        <div className="flex flex-col gap-2 max-w-lg">
          <label className="text-xs font-semibold text-zinc-300">Notification Level</label>
          <select
            value={formData.notificationLevel}
            onChange={(e) => setFormData((prev) => ({ ...prev, notificationLevel: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          >
            <option value="All Messages (Recommended for small servers)">All Messages (Recommended for small servers)</option>
            <option value="Only @mentions (Recommended for large communities)">Only @mentions (Recommended for large communities)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: Safety & Verification Levels                                   */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-400" />
            Safety & Verification Levels
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verification criteria required before members can send messages or react.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Verification Level</label>
            <select
              value={formData.verificationLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, verificationLevel: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="None — Unrestricted">None — Unrestricted</option>
              <option value="Low — Must have a verified email on their Discord account">Low — Must have a verified email on their Discord account</option>
              <option value="Medium — Must be registered on Discord for longer than 5 minutes">Medium — Must be registered on Discord for longer than 5 minutes</option>
              <option value="High — Must be a member of this server for longer than 10 minutes">High — Must be a member of this server for longer than 10 minutes</option>
              <option value="Highest — Must have a verified phone number on their Discord account">Highest — Must have a verified phone number on their Discord account</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Explicit Media Content Filter</label>
            <select
              value={formData.mediaFilter}
              onChange={(e) => setFormData((prev) => ({ ...prev, mediaFilter: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="Don't scan any media content">Do not scan any media content</option>
              <option value="Scan media content from members without roles">Scan media content from members without roles</option>
              <option value="Scan media content from all members (Recommended)">Scan media content from all members (Recommended)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: Custom Vanity URL                                              */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <Link2 size={18} className="text-red-400" />
              Custom Invite Link (Vanity URL)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Custom invite URL for your server.
            </p>
          </div>
          <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
            Level 3 Boost Perk
          </span>
        </div>

        <div className="flex items-center gap-3 max-w-md">
          <span className="text-xs font-mono text-zinc-400 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            discord.gg/
          </span>
          <input
            type="text"
            value={formData.vanityUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, vanityUrl: e.target.value }))}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING POPUP SAVE BAR (Triggered automatically when isDirty is true)    */}
      {/* ========================================================================= */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      />
    </motion.div>
  );
}
