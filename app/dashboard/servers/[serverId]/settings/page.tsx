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
  Terminal,
  FileText,
  Bell,
  ShieldAlert,
  Link2,
  MessageSquare
} from 'lucide-react';
import { mockServersApi, ServerData } from '@/lib/mockServersApi';
import { Toggle } from '@/components/ui/Toggle';

export default function ServerSettingsPage() {
  const params = useParams();
  const serverId = params?.serverId as string;

  const [server, setServer] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Section 1: Server Identity & Branding
  const [serverName, setServerName] = useState<string>('');
  const [prefix, setPrefix] = useState<string>('!');
  const [locale, setLocale] = useState<string>('English (US) — en-US');
  const [description, setDescription] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Section 2: System Messages Channel & Event Messages
  const [systemChannel, setSystemChannel] = useState<string>('#welcome');
  const [sendWelcome, setSendWelcome] = useState<boolean>(true);
  const [stickerPrompt, setStickerPrompt] = useState<boolean>(true);
  const [boostMessage, setBoostMessage] = useState<boolean>(true);
  const [setupTips, setSetupTips] = useState<boolean>(false);

  // Section 3: Default Notification Settings
  const [notificationLevel, setNotificationLevel] = useState<string>('Only @mentions (Recommended for large communities)');

  // Section 4: Safety & Verification Levels
  const [verificationLevel, setVerificationLevel] = useState<string>('High — Must be a member of this server for longer than 10 minutes');
  const [mediaFilter, setMediaFilter] = useState<string>('Scan media content from all members (Recommended)');

  // Section 5: Custom Invite Link (Vanity URL)
  const [vanityUrl, setVanityUrl] = useState<string>('rng-network');

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
          setServerName(found.name);
          setPrefix(found.prefix);
          setDescription(found.description);
          setLogoPreview(found.icon);
          setBannerPreview(found.banner);
          setSystemChannel(found.welcomeChannel || '#welcome');
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
        name: serverName,
        icon: logoPreview,
        banner: bannerPreview,
        description,
        prefix,
        locale,
        welcomeChannel: systemChannel
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

      {/* ========================================================================= */}
      {/* SECTION 1: Server Overview & Identity                                     */}
      {/* ========================================================================= */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            Server Overview & Identity
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Basic server profile details, icon, banner, and locale.
          </p>
        </div>

        {/* Branding Row: Logo Uploader + Banner Uploader */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-white/5">
          {/* Logo Upload */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles size={14} className="text-red-400" />
              Server Icon
            </span>

            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-2 border-red-500/40 bg-black/80 shadow-[0_0_20px_rgba(225,29,46,0.25)] shrink-0 flex items-center justify-center">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Server Logo"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-zinc-500 font-mono">
                    {server.shortName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-white">Custom Server Icon</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Supported formats: PNG, JPG, WEBP, GIF (Level 2 Boost required for GIF).
                </p>

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-fit px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,46,0.15)]"
                >
                  <Upload size={13} className="text-red-400" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner Upload with Level 2 Boost Check */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={14} className="text-red-400" />
                Server Banner Background
              </span>
              <span
                className={`text-[10.5px] px-2 py-0.5 rounded-md font-mono ${
                  isBannerLocked
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isBannerLocked ? 'Requires Level 2' : 'Level 2 Active'}
              </span>
            </div>

            <div className="relative w-full h-24 md:h-28 rounded-2xl overflow-hidden border-2 border-red-500/30 bg-black/80 flex items-center justify-center">
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt="Server Banner Preview"
                  fill
                  unoptimized
                  className={`object-cover ${isBannerLocked ? 'blur-md opacity-30' : ''}`}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r from-red-950/40 via-black to-zinc-950 ${isBannerLocked ? 'blur-md opacity-30' : ''}`} />
              )}

              {/* Locked Overlay if Server lacks Boost Level 2 */}
              {isBannerLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center z-20">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(225,29,46,0.4)] mb-1">
                    <Lock size={16} />
                  </div>
                  <span className="text-xs font-bold text-white font-mono">Banner Feature Locked</span>
                  <span className="text-[10px] text-red-300 font-mono">Lacks Boost Level 2</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                16:9 Aspect Ratio (1920x1080)
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
                <span>Upload Banner</span>
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
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
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
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">Server Preferred Locale</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: System Messages Channel & Event Messages                       */}
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
            value={systemChannel}
            onChange={(e) => setSystemChannel(e.target.value)}
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
              checked={sendWelcome}
              onChange={setSendWelcome}
              label="Random Welcome Messages"
              description="Send a welcome message when someone joins this server"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={stickerPrompt}
              onChange={setStickerPrompt}
              label="Sticker Reply Prompt"
              description="Prompt members to reply to welcome messages with a sticker"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={boostMessage}
              onChange={setBoostMessage}
              label="Server Boost Announcements"
              description="Send a message when someone boosts this server"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <Toggle
              checked={setupTips}
              onChange={setSetupTips}
              label="Helpful Setup Tips"
              description="Send helpful tips for server configuration and bot usage"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Default Notification Settings                                  */}
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
            value={notificationLevel}
            onChange={(e) => setNotificationLevel(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          >
            <option value="All Messages (Recommended for small servers)">All Messages (Recommended for small servers)</option>
            <option value="Only @mentions (Recommended for large communities)">Only @mentions (Recommended for large communities)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Safety & Verification Levels                                   */}
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
              value={verificationLevel}
              onChange={(e) => setVerificationLevel(e.target.value)}
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
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value)}
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
      {/* SECTION 5: Custom Vanity URL                                              */}
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
            value={vanityUrl}
            onChange={(e) => setVanityUrl(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Save Button */}
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
