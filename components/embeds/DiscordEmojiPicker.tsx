"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  EmojiItem,
  EmojiCategory,
  DISCORD_EMOJI_CATEGORIES,
  DEFAULT_BOT_EMOJIS,
  UNICODE_EMOJIS,
  getCustomBotEmojis,
  saveCustomBotEmoji,
  getFrequentlyUsedEmojis,
  recordEmojiUsage,
  formatEmojiInsertString
} from './emoji-data';

interface DiscordEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: EmojiItem, insertString: string) => void;
  triggerRect?: DOMRect | null;
  serverEmojis?: EmojiItem[];
  serverName?: string;
}

export function DiscordEmojiPicker({
  isOpen,
  onClose,
  onSelect,
  triggerRect,
  serverEmojis,
  serverName
}: DiscordEmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(serverEmojis && serverEmojis.length > 0 ? 'server' : 'smileys');
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiItem | null>(null);
  const [customBotEmojis, setCustomBotEmojis] = useState<EmojiItem[]>([]);
  const [frequentEmojis, setFrequentEmojis] = useState<EmojiItem[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Emoji Form state
  const [rawEmojiInput, setRawEmojiInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [customId, setCustomId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customAnimated, setCustomAnimated] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      setCustomBotEmojis(getCustomBotEmojis());
      setFrequentEmojis(getFrequentlyUsedEmojis());
      setSearchQuery('');
      setHoveredEmoji(null);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !showAddCustomModal
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showAddCustomModal, onClose]);

  // Fast auto-fill parse for <:name:id> or <a:name:id>
  const handleRawCustomEmojiInput = (val: string) => {
    setRawEmojiInput(val);
    const match = val.trim().match(/<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/);
    if (match) {
      const isAnim = match[1] === 'a';
      const name = match[2];
      const id = match[3];
      setCustomName(name);
      setCustomId(id);
      setCustomAnimated(isAnim);
      setCustomUrl(`https://cdn.discordapp.com/emojis/${id}.${isAnim ? 'gif' : 'webp'}?size=64`);
    }
  };

  const handleSaveCustomEmoji = () => {
    if (!customName.trim() || !customId.trim()) {
      alert('Please provide both an Emoji Name and a Discord Snowflake ID.');
      return;
    }
    try {
      const newEmoji = saveCustomBotEmoji({
        name: customName.trim(),
        id: customId.trim(),
        url: customUrl.trim() || `https://cdn.discordapp.com/emojis/${customId.trim()}.${customAnimated ? 'gif' : 'webp'}?size=64`,
        animated: customAnimated
      });
      setCustomBotEmojis(getCustomBotEmojis());
      setShowAddCustomModal(false);
      setRawEmojiInput('');
      setCustomName('');
      setCustomId('');
      setCustomUrl('');
      setCustomAnimated(false);
      handleEmojiSelect(newEmoji);
    } catch (err: any) {
      alert(err.message || 'Failed to save custom emoji');
    }
  };

  const handleEmojiSelect = (emoji: EmojiItem) => {
    recordEmojiUsage(emoji);
    const insertStr = formatEmojiInsertString(emoji);
    onSelect(emoji, insertStr);
    onClose();
  };

  // Scroll to category in scroll pane
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = categoryRefs.current[catId];
    if (el && scrollPaneRef.current) {
      scrollPaneRef.current.scrollTo({
        top: el.offsetTop - 10,
        behavior: 'smooth'
      });
    }
  };

  // Category rail list with dynamic server category
  const categoriesList = useMemo(() => {
    if (!serverEmojis || serverEmojis.length === 0) return DISCORD_EMOJI_CATEGORIES;
    const serverCategory: EmojiCategory = {
      id: 'server',
      label: serverName ? `${serverName} Emojis` : 'Server Emojis',
      icon: 'fa-solid fa-server'
    };
    const res = [...DISCORD_EMOJI_CATEGORIES];
    res.splice(1, 0, serverCategory);
    return res;
  }, [serverEmojis, serverName]);

  // Filtered emoji list for search
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const allBot = customBotEmojis.length > 0 ? customBotEmojis : DEFAULT_BOT_EMOJIS;
    const allServer = serverEmojis || [];
    const all = [...allServer, ...allBot, ...UNICODE_EMOJIS];

    return all.filter(e => {
      if (e.name.toLowerCase().includes(q)) return true;
      if (e.keywords?.some(k => k.toLowerCase().includes(q))) return true;
      if (e.id && e.id.includes(q)) return true;
      return false;
    });
  }, [searchQuery, customBotEmojis, serverEmojis]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-overlay open"
        onClick={onClose}
        style={{
          zIndex: 1000000,
          backdropFilter: 'blur(12px)',
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          inset: 0
        }}
      >
        <div
          ref={popoverRef}
          className="discord-emoji-picker-popover"
          style={{
            position: 'relative',
            margin: 'auto',
            maxHeight: '85vh',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#2b2d31',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Search Bar */}
          <div className="emoji-picker-search-bar" style={{ background: '#232428', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="text"
              className="emoji-search-input"
              placeholder="Search emoji or paste <:name:id>..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
              autoFocus
            />
            <i
              className="fa-solid fa-magnifying-glass emoji-search-icon"
              style={{ position: 'absolute', left: '26px', color: '#949ba4', fontSize: '13px' }}
            />
            {searchQuery && (
              <button
                className="emoji-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

        {/* Body: Left Rail + Scrollable Content */}
        <div className="emoji-picker-body-wrapper">
          {/* Left Category Rail */}
          <div className="emoji-picker-rail">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`emoji-rail-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => scrollToCategory(cat.id)}
                title={cat.label}
              >
                <i className={cat.icon} />
              </button>
            ))}
          </div>

          {/* Scrollable Emoji Grid Pane */}
          <div className="emoji-picker-scroll-pane" ref={scrollPaneRef}>
            {searchQuery.trim() ? (
              // Search Results View
              <div className="emoji-section">
                <div className="emoji-section-header">
                  <span>Search Results ({filteredEmojis?.length || 0})</span>
                </div>
                <div className="emoji-grid">
                  {filteredEmojis && filteredEmojis.length > 0 ? (
                    filteredEmojis.map((emoji, idx) => (
                      <button
                        key={`${emoji.name}_${emoji.id || emoji.char}_${idx}`}
                        type="button"
                        className="emoji-cell-btn"
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        onMouseLeave={() => setHoveredEmoji(null)}
                        onClick={() => handleEmojiSelect(emoji)}
                        title={`:${emoji.name}:`}
                      >
                        {emoji.type === 'custom' ? (
                          <img
                            src={emoji.url}
                            alt={emoji.name}
                            className="bot-emoji-img"
                            loading="lazy"
                          />
                        ) : (
                          <span>{emoji.char}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '20px 10px', color: '#949ba4', fontSize: '12px', gridColumn: 'span 8' }}>
                      No matching Discord or Unicode emojis found for "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Categorized Normal View
              <>
                {/* 1. Frequently Used */}
                {frequentEmojis.length > 0 && (
                  <div
                    className="emoji-section"
                    ref={(el) => { categoryRefs.current['recent'] = el; }}
                  >
                    <div className="emoji-section-header">
                      <span>Frequently Used</span>
                    </div>
                    <div className="emoji-grid">
                      {frequentEmojis.map((emoji, idx) => (
                        <button
                          key={`frequent_${emoji.name}_${idx}`}
                          type="button"
                          className="emoji-cell-btn"
                          onMouseEnter={() => setHoveredEmoji(emoji)}
                          onMouseLeave={() => setHoveredEmoji(null)}
                          onClick={() => handleEmojiSelect(emoji)}
                          title={`:${emoji.name}:`}
                        >
                          {emoji.type === 'custom' ? (
                            <img src={emoji.url} alt={emoji.name} className="bot-emoji-img" />
                          ) : (
                            <span>{emoji.char}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Server / Guild Emojis */}
                {serverEmojis && serverEmojis.length > 0 && (
                  <div
                    className="emoji-section"
                    ref={(el) => { categoryRefs.current['server'] = el; }}
                  >
                    <div className="emoji-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{serverName ? `${serverName} Emojis` : 'Server Emojis'}</span>
                        <span className="inspector-badge-custom" style={{ background: '#23a55a', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                          SERVER
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#949ba4' }}>{serverEmojis.length} emojis</span>
                    </div>
                    <div className="emoji-grid">
                      {serverEmojis.map((emoji) => (
                        <button
                          key={`server_${emoji.id}_${emoji.name}`}
                          type="button"
                          className="emoji-cell-btn"
                          onMouseEnter={() => setHoveredEmoji(emoji)}
                          onMouseLeave={() => setHoveredEmoji(null)}
                          onClick={() => handleEmojiSelect(emoji)}
                          title={`<:${emoji.name}:${emoji.id}>`}
                        >
                          <img
                            src={emoji.url}
                            alt={emoji.name}
                            className="bot-emoji-img"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Bot Emojis */}
                <div
                  className="emoji-section"
                  ref={(el) => { categoryRefs.current['bot'] = el; }}
                >
                  <div className="emoji-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Bot Emojis</span>
                      <span className="inspector-badge-custom" style={{ background: '#5865F2', color: '#fff', padding: '2px 5px', borderRadius: '4px', fontSize: '10px' }}>BOT</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomModal(true)}
                      style={{
                        background: 'rgba(225, 29, 46, 0.2)',
                        border: '1px solid rgba(225, 29, 46, 0.4)',
                        color: '#fff',
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fa-solid fa-plus" /> Add Bot Emoji
                    </button>
                  </div>
                  <div className="emoji-grid">
                    {(customBotEmojis.length > 0 ? customBotEmojis : DEFAULT_BOT_EMOJIS).map((emoji) => (
                      <button
                        key={`bot_${emoji.id}_${emoji.name}`}
                        type="button"
                        className="emoji-cell-btn"
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        onMouseLeave={() => setHoveredEmoji(null)}
                        onClick={() => handleEmojiSelect(emoji)}
                        title={`<:${emoji.name}:${emoji.id}>`}
                      >
                        <img
                          src={emoji.url}
                          alt={emoji.name}
                          className="bot-emoji-img"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Unicode Categories */}
                {DISCORD_EMOJI_CATEGORIES.filter(c => c.id !== 'recent' && c.id !== 'bot').map((cat) => {
                  const catEmojis = UNICODE_EMOJIS.filter(e => e.category === cat.id);
                  if (catEmojis.length === 0) return null;

                  return (
                    <div
                      key={cat.id}
                      className="emoji-section"
                      ref={(el) => { categoryRefs.current[cat.id] = el; }}
                    >
                      <div className="emoji-section-header">
                        <span>{cat.label}</span>
                      </div>
                      <div className="emoji-grid">
                        {catEmojis.map((emoji, idx) => (
                          <button
                            key={`${cat.id}_${emoji.name}_${idx}`}
                            type="button"
                            className="emoji-cell-btn"
                            onMouseEnter={() => setHoveredEmoji(emoji)}
                            onMouseLeave={() => setHoveredEmoji(null)}
                            onClick={() => handleEmojiSelect(emoji)}
                            title={`:${emoji.name}:`}
                          >
                            <span>{emoji.char}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* BOTTOM HOVER INSPECTOR FOOTER (1:1 Discord Replica with vivid Emoji ID Display) */}
        <div className="emoji-picker-inspector" style={{ background: '#232428', borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 14px' }}>
          <div className="inspector-preview-box" style={{ background: '#111214', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {hoveredEmoji ? (
              hoveredEmoji.type === 'custom' ? (
                <img src={hoveredEmoji.url} alt={hoveredEmoji.name} />
              ) : (
                <span style={{ fontSize: '24px' }}>{hoveredEmoji.char}</span>
              )
            ) : (
              <i className="fa-regular fa-face-smile" style={{ color: '#5865F2' }} />
            )}
          </div>
          <div className="inspector-info">
            <div className="inspector-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hoveredEmoji ? (
                <>
                  <span style={{ color: '#fff', fontWeight: 800 }}>:{hoveredEmoji.name}:</span>
                  {hoveredEmoji.category === 'server' ? (
                    <span className="inspector-badge-custom" style={{ background: '#23a55a', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                      SERVER EMOJI
                    </span>
                  ) : hoveredEmoji.type === 'custom' ? (
                    <span className="inspector-badge-custom" style={{ background: '#5865F2', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                      BOT EMOJI
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ededed', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                      UNICODE
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: '#949ba4' }}>HOVER ANY EMOJI TO INSPECT</span>
              )}
            </div>
            <div className="inspector-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#949ba4', marginTop: '2px' }}>
              {hoveredEmoji ? (
                hoveredEmoji.type === 'custom' ? (
                  <>
                    <span style={{ color: '#fff' }}>Syntax:</span> {hoveredEmoji.animated ? `<a:${hoveredEmoji.name}:${hoveredEmoji.id}>` : `<:${hoveredEmoji.name}:${hoveredEmoji.id}>`}
                    <span style={{ color: '#949ba4', margin: '0 6px' }}>|</span>
                    <span style={{ color: '#fff' }}>ID:</span> <span style={{ color: '#38bdf8' }}>{hoveredEmoji.id}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#fff' }}>Emoji:</span> {hoveredEmoji.char}
                    <span style={{ color: '#949ba4', margin: '0 6px' }}>|</span>
                    <span style={{ color: '#fff' }}>Codepoint ID:</span> <span style={{ color: '#38bdf8' }}>U+{hoveredEmoji.char ? hoveredEmoji.char.codePointAt(0)?.toString(16).toUpperCase() : '0000'}</span>
                    <span style={{ color: '#949ba4', margin: '0 6px' }}>|</span>
                    <span style={{ color: '#fff' }}>Category:</span> {hoveredEmoji.category}
                  </>
                )
              ) : (
                'RNG Control Center • Unified Unicode & Bot Emoji Picker'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ADD CUSTOM DISCORD BOT EMOJI MODAL */}
      {showAddCustomModal && (
        <div
          className="modal-overlay open"
          onClick={() => setShowAddCustomModal(false)}
          style={{ zIndex: 1000001 }}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-robot" style={{ color: 'var(--discord-cyan)' }} />
                <span>Add Custom Discord Bot Emoji</span>
              </div>
              <button
                className="btn-container-close"
                onClick={() => setShowAddCustomModal(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                className="modal-section-callout"
                style={{ margin: 0, background: 'rgba(0, 168, 252, 0.08)', borderColor: 'rgba(0, 168, 252, 0.25)', color: 'var(--discord-cyan)' }}
              >
                <i className="fa-solid fa-circle-info" />
                <span>Paste a Discord custom emoji string (e.g. <code>&lt;:pepe_hype:10182738491823&gt;</code> or animated <code>&lt;a:nitro:987654321&gt;</code>) or enter manually.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Discord Emoji String (Fast Auto-Fill)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="<:pepe_dance:123456789012345678>"
                  value={rawEmojiInput}
                  onChange={(e) => handleRawCustomEmojiInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Emoji Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="pepe_dance"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Discord Snowflake ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456789012345678"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (Optional, defaults to Discord CDN)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://cdn.discordapp.com/emojis/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={customAnimated}
                    onChange={(e) => setCustomAnimated(e.target.checked)}
                  />
                  <span>Animated GIF Emoji</span>
                </label>
                <button
                  type="button"
                  className="btn-dispatch-submit"
                  style={{ width: 'auto', padding: '8px 22px' }}
                  onClick={handleSaveCustomEmoji}
                >
                  Save Bot Emoji
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
