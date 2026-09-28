"use client";

import React, { useState, useMemo } from 'react';
import { DiscordInnerComponent } from './types';

interface ComponentsTabProps {
  onInsertComponent: (typeNum: number) => void;
}

interface ComponentSpecItem {
  typeNum: number;
  name: string;
  scope: 'Message V2' | 'In Action Row' | 'Modal Only';
  desc: string;
  category: string;
}

const SPEC_ITEMS: ComponentSpecItem[] = [
  // 1. Layout & Containers
  {
    typeNum: 17,
    name: 'Container',
    scope: 'Message V2',
    category: '1. Message Layout & Containers',
    desc: 'Primary V2 wrapper. Replaces classic embeds. Holds action rows, sections, text displays, media galleries, files, and separators with accent color.'
  },
  {
    typeNum: 1,
    name: 'Action Row',
    scope: 'Message V2',
    category: '1. Message Layout & Containers',
    desc: 'Horizontal interactive container. Holds either up to 5 Buttons OR exactly 1 Select Menu.'
  },
  {
    typeNum: 9,
    name: 'Section',
    scope: 'Message V2',
    category: '1. Message Layout & Containers',
    desc: 'Pairs 1–3 Text Displays with 1 accessory element (Thumbnail Type 11 or Button Type 2).'
  },
  {
    typeNum: 14,
    name: 'Separator',
    scope: 'Message V2',
    category: '1. Message Layout & Containers',
    desc: 'Divider line or spacing gap. Uses integer spacing: 1 = small, 2 = large.'
  },

  // 2. Content & Media
  {
    typeNum: 10,
    name: 'Text Display',
    scope: 'Message V2',
    category: '2. Message Content & Media',
    desc: 'V2 replacement for legacy message content and description. Supports full Discord markdown syntax.'
  },
  {
    typeNum: 12,
    name: 'Media Gallery',
    scope: 'Message V2',
    category: '2. Message Content & Media',
    desc: 'Displays 1–10 media items seamlessly. Uses standard Discord media items.'
  },
  {
    typeNum: 13,
    name: 'File Attachment',
    scope: 'Message V2',
    category: '2. Message Content & Media',
    desc: 'Attached file card. URL uses the attachment://filename protocol.'
  },
  {
    typeNum: 11,
    name: 'Thumbnail Accessory',
    scope: 'Message V2',
    category: '2. Message Content & Media',
    desc: 'Accessory media element used exclusively attached to a Section (Type 9).'
  },

  // 3. Interactive Controls
  {
    typeNum: 2,
    name: 'Button',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: 'Interactive buttons with styles 1-5, custom_id, partial emoji object, and click handlers.'
  },
  {
    typeNum: 3,
    name: 'String Select',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: '1–25 custom options with label, value, emoji, description, and default selection.'
  },
  {
    typeNum: 5,
    name: 'User Select',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: 'Auto-populated server member picker wrapped in an Action Row.'
  },
  {
    typeNum: 6,
    name: 'Role Select',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: 'Auto-populated guild role picker wrapped in an Action Row.'
  },
  {
    typeNum: 7,
    name: 'Mentionable Select',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: 'Auto-populated user or role picker wrapped in an Action Row.'
  },
  {
    typeNum: 8,
    name: 'Channel Select',
    scope: 'In Action Row',
    category: '3. Message Interactive Controls',
    desc: 'Channel picker with optional channel type filters wrapped in an Action Row.'
  },

  // 4. Modal-Only Components
  {
    typeNum: 4,
    name: 'Text Input',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: 'Single or multi-line text input field used exclusively inside modals wrapped in Label.'
  },
  {
    typeNum: 18,
    name: 'Label',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: 'Modal layout wrapper. Wraps Text Input, Selects, Radio Group, Checkbox Group, etc.'
  },
  {
    typeNum: 19,
    name: 'File Upload',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: 'Interactive upload element allowing users to upload files directly via modals.'
  },
  {
    typeNum: 21,
    name: 'Radio Group',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: '2–10 options. Exactly one choice selected. Uses default: true boolean.'
  },
  {
    typeNum: 22,
    name: 'Checkbox Group',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: '1–10 options with multiple selection support in Discord modal forms.'
  },
  {
    typeNum: 23,
    name: 'Checkbox',
    scope: 'Modal Only',
    category: '4. Modal-Only Components (Discord Interactive Forms)',
    desc: 'Single boolean toggle component with custom_id and default state.'
  }
];

export function ComponentsTab({ onInsertComponent }: ComponentsTabProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SPEC_ITEMS;
    return SPEC_ITEMS.filter(item =>
      item.name.toLowerCase().includes(q) ||
      `type ${item.typeNum}`.includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.scope.toLowerCase().includes(q)
    );
  }, [search]);

  // Group by category
  const categories = useMemo(() => {
    const cats: { [key: string]: ComponentSpecItem[] } = {};
    filtered.forEach(item => {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    });
    return cats;
  }, [filtered]);

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-puzzle-piece" style={{ color: 'var(--discord-cyan)' }} />
              Discord Components V2 Specification
            </h2>
            <span className="v2-status-pill-valid" style={{ fontSize: '11px', padding: '3px 10px' }}>
              <i className="fa-solid fa-shield-halved" /> Official 2026 Developer Standards
            </span>
          </div>
          <p style={{ color: 'var(--color-foreground-muted)', fontSize: '13px', marginTop: '4px' }}>
            Complete specification reference for Discord Components V2 messages (flag 32768) and modal form components. Click any component to insert it into your builder.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', fontSize: '13px', height: '38px', borderRadius: '8px' }}
            placeholder="Search components (Type 1-23)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#949ba4', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Categories & Grids */}
      {Object.entries(categories).map(([catTitle, items]) => (
        <div key={catTitle} style={{ marginBottom: '24px' }}>
          <div
            className="modal-section-title"
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              color: catTitle.includes('Modal') ? '#fbbf24' : '#fff'
            }}
          >
            {catTitle}
          </div>

          {catTitle.includes('Modal') && (
            <div className="modal-section-callout" style={{ marginBottom: '12px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '13px' }} />
              <span>
                <strong>Discord Rules Notice:</strong> Types 4, 18, 19, 21, 22, 23 are strictly <strong>Modal-Only</strong> components. Discord rejects messages containing them. In modals, they must be wrapped inside a <strong>Type 18 Label</strong>.
              </span>
            </div>
          )}

          <div className="types-23-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {items.map((item) => (
              <div
                key={`comp_type_${item.typeNum}`}
                className="type-select-card"
                onClick={() => onInsertComponent(item.typeNum)}
                style={{
                  background: 'rgba(18, 18, 23, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
                }}
              >
                <div className="type-card-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span className="type-card-name" style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      className={`type-scope-badge ${item.scope === 'Modal Only' ? 'scope-modal' : 'scope-msg'}`}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: item.scope === 'Modal Only' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 168, 252, 0.15)',
                        color: item.scope === 'Modal Only' ? '#f59e0b' : '#00a8fc',
                        fontWeight: 600
                      }}
                    >
                      {item.scope}
                    </span>
                    <span className="type-number-pill" style={{ background: '#5865F2', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>
                      Type {item.typeNum}
                    </span>
                  </div>
                </div>
                <span className="type-card-desc" style={{ fontSize: '12px', color: '#949ba4', lineHeight: 1.45 }}>
                  {item.desc}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--discord-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <i className="fa-solid fa-plus" /> Add to Builder
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#949ba4' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>No components match "{search}"</div>
        </div>
      )}

    </div>
  );
}
