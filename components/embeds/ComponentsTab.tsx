"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DiscordInnerComponent, ButtonStyle } from './types';
import { DiscordEmojiPicker } from './DiscordEmojiPicker';
import { EmojiItem } from './emoji-data';

interface ComponentsTabProps {
  onInsertComponent: (item: number | DiscordInnerComponent) => void;
  allowCreate?: boolean;
  allowSearch?: boolean;
}

interface ComponentSpecItem {
  typeNum: number;
  name: string;
  scope: 'Message V2' | 'In Action Row';
  desc: string;
  category: 'Default Components';
  previewBadge: string;
}

export interface CustomComponentItem {
  id: string;
  name: string;
  typeNum: number;
  desc: string;
  component: DiscordInnerComponent;
  createdAt: string;
}

const STORAGE_KEY_CUSTOM_COMPONENTS = 'rng_discord_user_components';

// Default standard Components V2 specification (Modal-only yellow items removed as requested)
const DEFAULT_SPEC_ITEMS: ComponentSpecItem[] = [
  // 1. Message Layout & Containers
  {
    typeNum: 17,
    name: 'Container',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Primary V2 wrapper. Replaces classic embeds. Holds action rows, sections, text displays, media galleries, files, and separators with accent color.',
    previewBadge: 'CONTAINER'
  },
  {
    typeNum: 1,
    name: 'Action Row',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Horizontal interactive container. Holds either up to 5 Buttons OR exactly 1 Select Menu.',
    previewBadge: 'ROW'
  },
  {
    typeNum: 9,
    name: 'Section',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Pairs 1–3 Text Displays with 1 accessory element (Thumbnail Type 11 or Button Type 2).',
    previewBadge: 'SECTION'
  },
  {
    typeNum: 14,
    name: 'Separator',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Divider line or spacing gap. Uses integer spacing: 1 = small, 2 = large.',
    previewBadge: 'SEPARATOR'
  },

  // 2. Content & Media
  {
    typeNum: 10,
    name: 'Text Display',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'V2 replacement for legacy message content and description. Supports full Discord markdown syntax.',
    previewBadge: 'MARKDOWN'
  },
  {
    typeNum: 12,
    name: 'Media Gallery',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Displays 1–10 media items seamlessly. Uses standard Discord media items.',
    previewBadge: 'MEDIA'
  },
  {
    typeNum: 13,
    name: 'File Attachment',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Attached file card. URL uses the attachment://filename protocol.',
    previewBadge: 'FILE'
  },
  {
    typeNum: 11,
    name: 'Thumbnail Accessory',
    scope: 'Message V2',
    category: 'Default Components',
    desc: 'Accessory media element used exclusively attached to a Section (Type 9).',
    previewBadge: 'THUMB'
  },

  // 3. Interactive Controls
  {
    typeNum: 2,
    name: 'Button',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: 'Interactive buttons with styles 1-5, custom_id, partial emoji object, and click handlers.',
    previewBadge: 'BUTTON'
  },
  {
    typeNum: 3,
    name: 'String Select',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: '1–25 custom options with label, value, emoji, description, and default selection.',
    previewBadge: 'SELECT'
  },
  {
    typeNum: 5,
    name: 'User Select',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: 'Auto-populated server member picker wrapped in an Action Row.',
    previewBadge: 'USER PICKER'
  },
  {
    typeNum: 6,
    name: 'Role Select',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: 'Auto-populated guild role picker wrapped in an Action Row.',
    previewBadge: 'ROLE PICKER'
  },
  {
    typeNum: 7,
    name: 'Mentionable Select',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: 'Auto-populated user or role picker wrapped in an Action Row.',
    previewBadge: 'MENTIONABLE'
  },
  {
    typeNum: 8,
    name: 'Channel Select',
    scope: 'In Action Row',
    category: 'Default Components',
    desc: 'Channel picker with optional channel type filters wrapped in an Action Row.',
    previewBadge: 'CHANNELS'
  }
];

const INITIAL_CUSTOM_COMPONENTS: CustomComponentItem[] = [
  {
    id: 'cust_verify_pill',
    name: 'Verified Member Button',
    typeNum: 2,
    desc: 'Green success button with checkmark emoji for membership verification.',
    createdAt: 'Default Preset',
    component: {
      type: 1,
      id: 'row_custom_verify',
      label: 'VERIFICATION',
      items: [
        { type: 2, style: 3, label: 'Verify Access', emoji: '✅', custom_id: 'btn_verify_access' }
      ]
    } as any
  },
  {
    id: 'cust_rules_row',
    name: 'Server Rules & Support Action Row',
    typeNum: 1,
    desc: 'Multi-button action row featuring official rules documentation and support ticket launcher.',
    createdAt: 'Default Preset',
    component: {
      type: 1,
      id: 'row_custom_rules',
      label: 'HELP & RULES',
      items: [
        { type: 2, style: 1, label: 'Read Guidelines', emoji: '📜', custom_id: 'btn_rules' },
        { type: 2, style: 2, label: 'Open Support', emoji: '🎫', custom_id: 'btn_support' },
        { type: 2, style: 5, label: 'Portal', emoji: '🌐', url: 'https://rng.gg' }
      ]
    } as any
  }
];

export function ComponentsTab({
  onInsertComponent,
  allowCreate = true,
  allowSearch = true
}: ComponentsTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'default' | 'custom'>('all');
  const [userComponents, setUserComponents] = useState<CustomComponentItem[]>([]);

  // Create Custom Component Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<number>(2); // default Button
  const [btnLabel, setBtnLabel] = useState('Explore Feature');
  const [btnEmoji, setBtnEmoji] = useState('⭐');
  const [btnStyle, setBtnStyle] = useState<ButtonStyle>(1);
  const [btnCustomId, setBtnCustomId] = useState('');
  const [textContent, setTextContent] = useState('### ✨ Feature Highlights\n• Fully customized Discord component\n• Instant 1-click insertion');
  const [sepSpacing, setSepSpacing] = useState<1 | 2>(2);
  const [sepDivider, setSepDivider] = useState(true);
  const [selectPlaceholder, setSelectPlaceholder] = useState('Choose an option...');

  // Emoji picker modal state inside create modal
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Load custom components from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_COMPONENTS);
      if (saved) {
        setUserComponents(JSON.parse(saved));
      } else {
        setUserComponents(INITIAL_CUSTOM_COMPONENTS);
      }
    } catch {
      setUserComponents(INITIAL_CUSTOM_COMPONENTS);
    }
  }, []);

  const saveUserComponents = (items: CustomComponentItem[]) => {
    setUserComponents(items);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_COMPONENTS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save custom components:', e);
    }
  };

  const handleCreateCustomComponent = () => {
    if (!compName.trim()) {
      alert('Please enter a component name.');
      return;
    }

    let builtComp: DiscordInnerComponent;

    switch (compType) {
      case 2: // Button (wrapped in Action Row for Discord safety)
        builtComp = {
          type: 1,
          id: `row_${Date.now()}`,
          label: compName.toUpperCase().slice(0, 10),
          items: [
            {
              type: 2,
              style: btnStyle,
              label: btnLabel.trim() || 'Button',
              emoji: btnEmoji.trim() || undefined,
              custom_id: btnStyle === 5 ? undefined : (btnCustomId.trim() || `btn_${Date.now()}`),
              url: btnStyle === 5 ? (btnCustomId.trim() || 'https://discord.com') : undefined
            }
          ]
        };
        break;

      case 1: // Action Row with 2 sample buttons
        builtComp = {
          type: 1,
          id: `row_${Date.now()}`,
          label: compName.toUpperCase().slice(0, 12),
          items: [
            {
              type: 2,
              style: btnStyle,
              label: btnLabel.trim() || 'Primary',
              emoji: btnEmoji.trim() || '⚡',
              custom_id: `btn_primary_${Date.now()}`
            },
            {
              type: 2,
              style: 2,
              label: 'Secondary',
              emoji: '🔹',
              custom_id: `btn_sec_${Date.now()}`
            }
          ]
        };
        break;

      case 10: // Text Display
        builtComp = {
          type: 10,
          id: `txt_${Date.now()}`,
          text: textContent.trim() || 'Text display content'
        };
        break;

      case 14: // Separator
        builtComp = {
          type: 14,
          id: `sep_${Date.now()}`,
          spacing: sepSpacing,
          divider: sepDivider
        };
        break;

      case 3: // String Select Menu
        builtComp = {
          type: 3,
          id: `sel_${Date.now()}`,
          custom_id: `menu_${Date.now()}`,
          placeholder: selectPlaceholder.trim() || 'Select an option...',
          options: [
            { label: 'Option 1', value: 'opt_1', emoji: '⭐', description: 'First custom option' },
            { label: 'Option 2', value: 'opt_2', emoji: '🔹', description: 'Second custom option' }
          ]
        };
        break;

      case 12: // Media Gallery
        builtComp = {
          type: 12,
          id: `gallery_${Date.now()}`,
          items: ['https://cdn.discordapp.com/embed/avatars/0.png']
        };
        break;

      default:
        builtComp = {
          type: compType as any,
          id: `comp_${Date.now()}`
        } as any;
        break;
    }

    const newItem: CustomComponentItem = {
      id: `custom_${Date.now()}`,
      name: compName.trim(),
      typeNum: compType,
      desc: `Custom ${compType === 2 ? 'Button' : compType === 1 ? 'Action Row' : compType === 10 ? 'Text Display' : 'Component'} created via Component Editor.`,
      component: builtComp,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newItem, ...userComponents];
    saveUserComponents(updated);

    // Reset Form
    setCompName('');
    setBtnLabel('Explore Feature');
    setBtnEmoji('⭐');
    setBtnStyle(1);
    setIsCreateModalOpen(false);
  };

  const handleDeleteCustomComponent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom component?')) return;
    const updated = userComponents.filter(c => c.id !== id);
    saveUserComponents(updated);
  };

  // Filtered lists based on search
  const filteredDefault = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DEFAULT_SPEC_ITEMS;
    return DEFAULT_SPEC_ITEMS.filter(item =>
      item.name.toLowerCase().includes(q) ||
      `type ${item.typeNum}`.includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.scope.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCustom = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return userComponents;
    return userComponents.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      `type ${item.typeNum}`.includes(q)
    );
  }, [search, userComponents]);

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-puzzle-piece" style={{ color: 'var(--discord-cyan)' }} />
              Discord Components V2 Catalog
            </h2>
            <span className="v2-status-pill-valid" style={{ fontSize: '11px', padding: '3px 10px' }}>
              <i className="fa-solid fa-shield-halved" /> Official 2026 Developer Standards
            </span>
          </div>
          <p style={{ color: 'var(--color-foreground-muted)', fontSize: '13px', marginTop: '4px' }}>
            Browse default message components or create customized buttons, select menus, and action rows with live interactive preview.
          </p>
        </div>

        {(allowSearch || allowCreate) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Bigger Search Bar */}
            {allowSearch && (
              <div style={{ position: 'relative', width: '340px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '34px', fontSize: '13.5px', height: '40px', borderRadius: '8px', background: '#1e1f22', borderColor: 'rgba(255,255,255,0.1)' }}
                  placeholder="Search components (Name, Type number)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#949ba4', fontSize: '13px' }}
                />
              </div>
            )}

            {/* Plus sign / Create Component Button */}
            {allowCreate && (
              <button
                type="button"
                className="btn-dispatch-submit"
                style={{ width: 'auto', padding: '10px 18px', fontSize: '13px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}
                onClick={() => setIsCreateModalOpen(true)}
                title="Create Custom Component with live preview"
              >
                <i className="fa-solid fa-plus" />
                <span>Create Component</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills: All, Default, Custom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`sub-tab-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
        >
          All Components ({filteredDefault.length + filteredCustom.length})
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${categoryFilter === 'default' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('default')}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
        >
          Default Components ({filteredDefault.length})
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${categoryFilter === 'custom' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('custom')}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
        >
          Custom Components ({filteredCustom.length})
        </button>
      </div>

      {/* CATEGORY 1: CUSTOM COMPONENTS */}
      {(categoryFilter === 'all' || categoryFilter === 'custom') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#00a8fc' }} />
              <span>Custom Components</span>
              <span style={{ fontSize: '11px', background: 'rgba(0,168,252,0.15)', color: '#00a8fc', padding: '1px 7px', borderRadius: '4px' }}>
                {filteredCustom.length}
              </span>
            </div>
            {allowCreate && (
              <button
                type="button"
                className="btn-header-action"
                style={{ padding: '4px 10px', fontSize: '11.5px', color: 'var(--discord-cyan)' }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <i className="fa-solid fa-plus" /> New Custom Component
              </button>
            )}
          </div>

          {filteredCustom.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {filteredCustom.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#2b2d31',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'transform 0.15s, border-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: '#5865F2', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        CUSTOM
                      </span>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#ff5b69', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                        title="Delete Custom Component"
                        onClick={(e) => handleDeleteCustomComponent(item.id, e)}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#949ba4', margin: 0, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>

                  {/* Component Live Simulation Card */}
                  <div style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '8px 10px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                    {item.component.type === 1 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(item.component as any).items?.map((btn: any, bIdx: number) => (
                          <div
                            key={bIdx}
                            className={`discord-btn btn-style-${btn.style || 1}`}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            {btn.emoji && <span>{typeof btn.emoji === 'string' ? btn.emoji : btn.emoji.name}</span>}
                            <span>{btn.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.component.type === 10 && (
                      <div style={{ fontSize: '12px', color: '#dbdee1', whiteSpace: 'pre-wrap' }}>
                        {(item.component as any).text}
                      </div>
                    )}
                    {item.component.type === 14 && (
                      <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.2)' }} />
                    )}
                    {item.component.type === 3 && (
                      <div style={{ fontSize: '12px', color: '#949ba4', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{(item.component as any).placeholder}</span>
                        <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }} />
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    className="btn-header-action"
                    style={{ background: 'rgba(0,168,252,0.12)', borderColor: 'rgba(0,168,252,0.3)', color: 'var(--discord-cyan)', justifyContent: 'center', marginTop: 'auto', fontWeight: 700 }}
                    onClick={() => onInsertComponent(item.component)}
                  >
                    <i className="fa-solid fa-plus" /> Add to Builder
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#949ba4' }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '24px', marginBottom: '8px', color: '#00a8fc' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>No custom components created yet</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Click the "+ Create Component" button above to design your own custom button or action row.</p>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY 2: DEFAULT DISCORD COMPONENTS */}
      {(categoryFilter === 'all' || categoryFilter === 'default') && (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-brands fa-discord" style={{ color: '#5865F2' }} />
            <span>Default Components</span>
            <span style={{ fontSize: '11px', background: 'rgba(88,101,242,0.15)', color: '#5865F2', padding: '1px 7px', borderRadius: '4px' }}>
              {filteredDefault.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {filteredDefault.map((item) => (
              <div
                key={`default_${item.typeNum}`}
                className="type-select-card"
                onClick={() => onInsertComponent(item.typeNum)}
                style={{
                  background: '#2b2d31',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 168, 252, 0.15)', color: '#00a8fc', fontWeight: 600 }}>
                      {item.scope}
                    </span>
                    <span style={{ background: '#5865F2', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      Type {item.typeNum}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#949ba4', lineHeight: 1.45 }}>
                  {item.desc}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--discord-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <i className="fa-solid fa-plus" /> Add to Builder
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POPUP MODAL: CREATE CUSTOM COMPONENT (Centered with backdrop blur, 3 fields + Sapphire editor) */}
      {allowCreate && isCreateModalOpen && (
        <div
          className="modal-overlay open"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backdropFilter: 'blur(14px)',
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#2b2d31',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
              borderRadius: '12px',
              margin: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#232428', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--discord-cyan)' }} />
                <span>Create Custom Component</span>
              </div>
              <button
                type="button"
                className="btn-container-close"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Modal Body with 3 Required Fields */}
            <div className="modal-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* FIELD 1: NAME (Input Box) */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#dbdee1' }}>
                  Component Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#1e1f22', borderColor: 'rgba(255,255,255,0.1)', fontSize: '13px' }}
                  placeholder="e.g. Server Verification Button, Support Ticket Row"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* FIELD 2: SELECT COMPONENT DROPDOWN (Dropdown Menu) */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#dbdee1' }}>
                  Select Component Type
                </label>
                <select
                  className="form-input"
                  style={{ background: '#1e1f22', borderColor: 'rgba(255,255,255,0.1)', fontSize: '13px', color: '#fff', height: '38px' }}
                  value={compType}
                  onChange={(e) => setCompType(Number(e.target.value))}
                >
                  <option value={2}>Button (Type 2)</option>
                  <option value={1}>Action Row (Type 1)</option>
                  <option value={10}>Text Display (Type 10)</option>
                  <option value={14}>Separator (Type 14)</option>
                  <option value={3}>String Select Menu (Type 3)</option>
                  <option value={12}>Media Gallery (Type 12)</option>
                </select>
              </div>

              {/* FIELD 3: PREVIEW WITH EDITOR (Sapphire-style dashboard with editable labels, emojis, styles) */}
              <div style={{ background: '#1e1f22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#949ba4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Component Editor & Preview
                </div>

                {/* Sub-Editor for Button / Action Row */}
                {(compType === 2 || compType === 1) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 2 }}>
                        <span style={{ fontSize: '11px', color: '#949ba4' }}>Button Label</span>
                        <input
                          type="text"
                          className="form-input"
                          style={{ height: '34px', fontSize: '12.5px', marginTop: '2px' }}
                          value={btnLabel}
                          onChange={(e) => setBtnLabel(e.target.value)}
                          placeholder="Button Label..."
                        />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <span style={{ fontSize: '11px', color: '#949ba4' }}>Emoji</span>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ height: '34px', fontSize: '13px', textAlign: 'center' }}
                            value={btnEmoji}
                            onChange={(e) => setBtnEmoji(e.target.value)}
                            placeholder="⭐"
                          />
                          <button
                            type="button"
                            className="wysiwyg-tool-btn"
                            style={{ height: '34px', width: '34px' }}
                            onClick={() => setIsEmojiPickerOpen(true)}
                            title="Pick Discord Emoji"
                          >
                            <i className="fa-regular fa-face-smile" style={{ color: 'var(--discord-cyan)' }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Style selector */}
                    <div>
                      <span style={{ fontSize: '11px', color: '#949ba4', display: 'block', marginBottom: '4px' }}>Button Style</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={`btn-style-chip ${btnStyle === 1 ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setBtnStyle(1)}
                        >
                          Primary (Blurple)
                        </button>
                        <button
                          type="button"
                          className={`btn-style-chip ${btnStyle === 2 ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setBtnStyle(2)}
                        >
                          Secondary (Grey)
                        </button>
                        <button
                          type="button"
                          className={`btn-style-chip ${btnStyle === 3 ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setBtnStyle(3)}
                        >
                          Success (Green)
                        </button>
                        <button
                          type="button"
                          className={`btn-style-chip ${btnStyle === 4 ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setBtnStyle(4)}
                        >
                          Danger (Red)
                        </button>
                        <button
                          type="button"
                          className={`btn-style-chip ${btnStyle === 5 ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => setBtnStyle(5)}
                        >
                          Link (Grey + Link)
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '10.5px', color: '#949ba4', display: 'block', marginBottom: '6px' }}>Discord Visual Preview:</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`discord-btn btn-style-${btnStyle}`}
                          style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {btnEmoji && <span>{btnEmoji}</span>}
                          <span>{btnLabel || 'Button'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Editor for Text Display */}
                {compType === 10 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      style={{ fontSize: '12.5px', lineHeight: 1.45 }}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                    />
                    <div style={{ marginTop: '4px', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12.5px', color: '#dbdee1' }}>
                      <span style={{ fontSize: '10px', color: '#949ba4', display: 'block', marginBottom: '2px' }}>Live Markdown Preview:</span>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{textContent}</div>
                    </div>
                  </div>
                )}

                {/* Sub-Editor for Separator */}
                {compType === 14 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#949ba4' }}>Spacing:</span>
                      <button
                        type="button"
                        className={`btn-ctrl-xs ${sepSpacing === 1 ? 'active-pill' : ''}`}
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => setSepSpacing(1)}
                      >
                        Small (1)
                      </button>
                      <button
                        type="button"
                        className={`btn-ctrl-xs ${sepSpacing === 2 ? 'active-pill' : ''}`}
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => setSepSpacing(2)}
                      >
                        Large (2)
                      </button>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff', marginLeft: 'auto', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sepDivider}
                          onChange={(e) => setSepDivider(e.target.checked)}
                        />
                        <span>Visible Line</span>
                      </label>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                      <div style={{ width: '100%', height: sepSpacing === 2 ? '4px' : '2px', background: sepDivider ? 'rgba(255,255,255,0.25)' : 'transparent', borderTop: sepDivider ? '1px solid rgba(255,255,255,0.3)' : 'none' }} />
                    </div>
                  </div>
                )}

                {/* Sub-Editor for Select Menu */}
                {compType === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: '34px', fontSize: '12px' }}
                      value={selectPlaceholder}
                      onChange={(e) => setSelectPlaceholder(e.target.value)}
                      placeholder="Placeholder text..."
                    />
                    <div style={{ padding: '8px 12px', background: '#111214', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#949ba4' }}>
                      <span>{selectPlaceholder}</span>
                      <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }} />
                    </div>
                  </div>
                )}

                {/* Sub-Editor for Media Gallery */}
                {compType === 12 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#949ba4' }}>
                    <i className="fa-solid fa-images" style={{ fontSize: '20px', color: 'var(--discord-cyan)' }} />
                    <span>Media Gallery component ready to embed up to 10 photos or GIFs.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 18px', background: '#232428', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                className="btn-header-action"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-dispatch-submit"
                style={{ width: 'auto', padding: '8px 22px' }}
                onClick={handleCreateCustomComponent}
              >
                <i className="fa-solid fa-check" /> Create Custom Component
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Emoji Picker for Custom Component Creation */}
      <DiscordEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelect={(emoji, insertStr) => {
          setBtnEmoji(insertStr);
          setIsEmojiPickerOpen(false);
        }}
      />

    </div>
  );
}
