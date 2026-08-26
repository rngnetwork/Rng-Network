"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Terminal,
  FileText
} from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';

export default function ServerSettingsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('!');

  // Toast notification state
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
          setLogoPreview(found.icon);
          setBannerPreview(found.banner);
          setDescription(found.description);
          setPrefix(found.prefix);
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
    setLogoPreview(objectUrl);
    showToast('success', `Server logo updated to ${file.name}!`);
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
    setBannerPreview(objectUrl);
    showToast('success', `Server banner updated to ${file.name}!`);
  };

  const handleSave = async () => {
    if (!server) return;
    setIsSaving(true);
    try {
      await mockServersApi.updateServerSettings(server.id, {
        icon: logoPreview,
        banner: bannerPreview,
        description,
        prefix
      });
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
      className="flex flex-col gap-8 w-full"
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

      {/* Header Description */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          Server Appearance & Configuration
        </h2>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Customize visual branding, command triggers, and descriptive meta for this Discord guild.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2-Column Grid: Server Logo (Left) and Server Banner (Beside Logo)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Server Logo Card */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={14} className="text-red-400" />
                Server Icon / Logo
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono">
                PNG, JPG, WEBP, GIF
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* Rounded Square Logo Preview */}
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 border-red-500/40 bg-black/80 shadow-[0_0_25px_rgba(225,29,46,0.3)] shrink-0 flex items-center justify-center">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Server Logo Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-zinc-500 font-mono">
                    {server.shortName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-white">Custom Guild Icon</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Recommended size: <code className="text-red-300">512x512px</code>. Animated GIF requires Boost Level 2+.
                </p>

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-1 w-fit px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,46,0.15)]"
                >
                  <Upload size={14} className="text-red-400" />
                  <span>Upload Logo</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-zinc-400">
            <Info size={15} className="text-red-400 shrink-0 mt-0.5" />
            <span>
              Server currently has <span className="text-white font-semibold font-mono">{server.boostCount} Boosts (Level {server.boostLevel})</span>.
            </span>
          </div>
        </div>

        {/* 2. Server Banner Card (Beside Logo) */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={14} className="text-red-400" />
                Server Banner
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                  isBannerLocked
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isBannerLocked ? 'Requires Level 2' : 'Level 2 Active'}
              </span>
            </div>

            {/* Rounded Square / Rectangle Banner Preview with Boost Lock logic */}
            <div className="relative w-full h-32 md:h-36 rounded-3xl overflow-hidden border-2 border-red-500/30 bg-black/80 flex items-center justify-center">
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt="Server Banner Preview"
                  fill
                  unoptimized
                  className={`object-cover ${isBannerLocked ? 'blur-md opacity-40' : ''}`}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r from-red-950/40 via-black to-zinc-950 ${isBannerLocked ? 'blur-md opacity-30' : ''}`} />
              )}

              {/* Locked Overlay if Boost Level < 2 */}
              {isBannerLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(225,29,46,0.4)] mb-1.5">
                    <Lock size={20} />
                  </div>
                  <span className="text-xs font-bold text-white font-mono">Banner Feature Locked</span>
                  <span className="text-[10.5px] text-red-300 font-mono mt-0.5">Lacks Boost Level 2</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-400">
                Recommended aspect ratio: <code className="text-red-300">16:9 (960x540)</code>
              </p>

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
                <span>Upload Banner</span>
              </button>
            </div>
          </div>

          {/* Locked Notice if Server lacks Boost Level */}
          {isBannerLocked && (
            <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-300/90">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <span>
                This server is not boosted to Level 2 and lacks server banner perks. Boost the Discord server with Nitro to unlock custom banners.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-Column Grid: Server Description & Bot Command Prefix                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Description Input (Spans 2 cols on desktop) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <FileText size={14} className="text-red-400" />
            Server Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter public overview and descriptive metadata for this server..."
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none leading-relaxed"
          />
          <span className="text-[11px] text-zinc-500 font-mono">
            Displayed on server overview cards and network-wide leaderboards.
          </span>
        </div>

        {/* Bot Command Prefix Input (Spans 1 col on desktop) */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal size={14} className="text-red-400" />
              Bot Command Prefix
            </label>
            <input
              type="text"
              maxLength={3}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="!"
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-base font-mono font-bold focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <span className="text-[11px] text-zinc-500 font-mono">
              Prefix trigger for RNG Network Bot commands in this guild.
            </span>
          </div>
        </div>
      </div>

      {/* Save Settings Action Button */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#E11D2E] to-[#8A0F1A] hover:from-[#FF3B4D] hover:to-[#B91C1C] text-white font-bold text-sm shadow-[0_0_20px_rgba(225,29,46,0.35)] hover:shadow-[0_0_35px_rgba(225,29,46,0.7)] border border-red-400/30 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{isSaving ? 'Saving Changes...' : 'Save Server Settings'}</span>
        </button>
      </div>
    </motion.div>
  );
}
