"use client";

import React from 'react';

interface PaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (typeNum: number) => void;
}

export function PaletteModal({
  isOpen,
  onClose,
  onSelectComponent
}: PaletteModalProps) {
  if (!isOpen) return null;

  const handleSelect = (typeNum: number) => {
    onSelectComponent(typeNum);
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cubes" style={{ color: 'var(--discord-cyan)' }} />
            <span>Insert Component (Type 1 to 23)</span>
          </div>
          <button className="btn-container-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Section 1: Message Layout & Containers */}
          <div className="modal-section-title">1. Message Layout & Containers (V2 Supported)</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(1)}>
              <div className="type-card-top">
                <span className="type-card-name">Action Row</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 1</span>
              </div>
              <span className="type-card-desc">Horizontal container for up to 5 buttons or 1 select menu.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(9)}>
              <div className="type-card-top">
                <span className="type-card-name">Section</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 9</span>
              </div>
              <span className="type-card-desc">1-3 Text Displays with required Thumbnail or Button accessory.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(14)}>
              <div className="type-card-top">
                <span className="type-card-name">Separator</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 14</span>
              </div>
              <span className="type-card-desc">Divider line or empty gap (Spacing 1 = small, 2 = large).</span>
            </div>
          </div>

          {/* Section 2: Message Content & Media */}
          <div className="modal-section-title">2. Message Content & Media (V2 Supported)</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(10)}>
              <div className="type-card-top">
                <span className="type-card-name">Text Display</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 10</span>
              </div>
              <span className="type-card-desc">Primary markdown content element in Components V2.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(12)}>
              <div className="type-card-top">
                <span className="type-card-name">Media Gallery</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 12</span>
              </div>
              <span className="type-card-desc">1–10 media items using '{`{ media: { url } }`}' structure.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(13)}>
              <div className="type-card-top">
                <span className="type-card-name">File Attachment</span>
                <span className="type-scope-badge scope-msg">Message V2</span>
                <span className="type-number-pill">Type 13</span>
              </div>
              <span className="type-card-desc">Attached file card using 'attachment://filename' protocol.</span>
            </div>
          </div>

          {/* Section 3: Interactive Controls */}
          <div className="modal-section-title">3. Message Interactive Controls (Auto-Wrapped in Action Row)</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(2)}>
              <div className="type-card-top">
                <span className="type-card-name">Button</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 2</span>
              </div>
              <span className="type-card-desc">Interactive button with styles 1-5, emoji, custom_id or url.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(3)}>
              <div className="type-card-top">
                <span className="type-card-name">String Select</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 3</span>
              </div>
              <span className="type-card-desc">Dropdown menu with custom options, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(5)}>
              <div className="type-card-top">
                <span className="type-card-name">User Select</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 5</span>
              </div>
              <span className="type-card-desc">Guild member picker, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(6)}>
              <div className="type-card-top">
                <span className="type-card-name">Role Select</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 6</span>
              </div>
              <span className="type-card-desc">Guild role picker, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(7)}>
              <div className="type-card-top">
                <span className="type-card-name">Mentionable Select</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 7</span>
              </div>
              <span className="type-card-desc">User/Role selector, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(8)}>
              <div className="type-card-top">
                <span className="type-card-name">Channel Select</span>
                <span className="type-scope-badge scope-msg">In Action Row</span>
                <span className="type-number-pill">Type 8</span>
              </div>
              <span className="type-card-desc">Channel picker, wrapped in Action Row.</span>
            </div>
          </div>

          {/* Section 4: Modal-Only Components */}
          <div className="modal-section-title" style={{ color: '#fbbf24' }}>4. Modal-Only Components (Discord Interactive Forms)</div>
          <div className="modal-section-callout">
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '13px' }} />
            <span>These components are strictly modal-only and are excluded from Discord V2 Message payloads.</span>
          </div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(4)}>
              <div className="type-card-top">
                <span className="type-card-name">Text Input</span>
                <span className="type-scope-badge scope-modal">Modal Only</span>
                <span className="type-number-pill">Type 4</span>
              </div>
              <span className="type-card-desc">Modal text field.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(18)}>
              <div className="type-card-top">
                <span className="type-card-name">Label</span>
                <span className="type-scope-badge scope-modal">Modal Only</span>
                <span className="type-number-pill">Type 18</span>
              </div>
              <span className="type-card-desc">Modal layout wrapper.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(21)}>
              <div className="type-card-top">
                <span className="type-card-name">Radio Group</span>
                <span className="type-scope-badge scope-modal">Modal Only</span>
                <span className="type-number-pill">Type 21</span>
              </div>
              <span className="type-card-desc">Single-choice radio options.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(22)}>
              <div className="type-card-top">
                <span className="type-card-name">Checkbox Group</span>
                <span className="type-scope-badge scope-modal">Modal Only</span>
                <span className="type-number-pill">Type 22</span>
              </div>
              <span className="type-card-desc">Multiple toggle checkboxes.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(23)}>
              <div className="type-card-top">
                <span className="type-card-name">Checkbox</span>
                <span className="type-scope-badge scope-modal">Modal Only</span>
                <span className="type-number-pill">Type 23</span>
              </div>
              <span className="type-card-desc">Single toggleable component.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
