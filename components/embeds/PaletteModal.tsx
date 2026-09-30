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
      <div
        className="modal-dialog"
        style={{
          maxWidth: '880px',
          width: '100%',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(139, 92, 246, 0.12)'
        }}
      >
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-cubes" style={{ color: '#c4b5fd', fontSize: '14px' }} />
            </div>
            <span>Insert Component</span>
            <span className="component-modal-badge purple">Components V2 Catalog</span>
          </div>
          <button className="btn-container-close" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: 'calc(min(88vh, 680px) - 60px)', overflowY: 'auto' }}>
          
          {/* Section 1: Message Layout & Containers */}
          <div className="modal-section-title">Message Layout & Containers</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(1)}>
              <div className="type-card-top">
                <span className="type-card-name">Action Row</span>
                <span className="type-number-pill">Type 1</span>
              </div>
              <span className="type-card-desc">Horizontal container for up to 5 buttons or 1 select menu.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(9)}>
              <div className="type-card-top">
                <span className="type-card-name">Section</span>
                <span className="type-number-pill">Type 9</span>
              </div>
              <span className="type-card-desc">1-3 Text Displays with required Thumbnail or Button accessory.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(14)}>
              <div className="type-card-top">
                <span className="type-card-name">Separator</span>
                <span className="type-number-pill">Type 14</span>
              </div>
              <span className="type-card-desc">Divider line or empty gap (Spacing 1 = small, 2 = large).</span>
            </div>
          </div>

          {/* Section 2: Message Content & Media */}
          <div className="modal-section-title">Message Content & Media</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(10)}>
              <div className="type-card-top">
                <span className="type-card-name">Text Display</span>
                <span className="type-number-pill">Type 10</span>
              </div>
              <span className="type-card-desc">Primary markdown content element in Components V2.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(12)}>
              <div className="type-card-top">
                <span className="type-card-name">Media Gallery</span>
                <span className="type-number-pill">Type 12</span>
              </div>
              <span className="type-card-desc">1–10 media items using &apos;{`{ media: { url } }`}&apos; structure.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(13)}>
              <div className="type-card-top">
                <span className="type-card-name">File Attachment</span>
                <span className="type-number-pill">Type 13</span>
              </div>
              <span className="type-card-desc">Attached file card using &apos;attachment://filename&apos; protocol.</span>
            </div>
          </div>

          {/* Section 3: Interactive Controls */}
          <div className="modal-section-title">Message Interactive Controls</div>
          <div className="types-23-grid">
            <div className="type-select-card" onClick={() => handleSelect(2)}>
              <div className="type-card-top">
                <span className="type-card-name">Button</span>
                <span className="type-number-pill">Type 2</span>
              </div>
              <span className="type-card-desc">Interactive button with styles 1-5, emoji, custom_id or url.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(3)}>
              <div className="type-card-top">
                <span className="type-card-name">String Select</span>

                <span className="type-number-pill">Type 3</span>
              </div>
              <span className="type-card-desc">Dropdown menu with custom options, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(5)}>
              <div className="type-card-top">
                <span className="type-card-name">User Select</span>
                <span className="type-number-pill">Type 5</span>
              </div>
              <span className="type-card-desc">Guild member picker, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(6)}>
              <div className="type-card-top">
                <span className="type-card-name">Role Select</span>
                <span className="type-number-pill">Type 6</span>
              </div>
              <span className="type-card-desc">Guild role picker, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(7)}>
              <div className="type-card-top">
                <span className="type-card-name">Mentionable Select</span>
                <span className="type-number-pill">Type 7</span>
              </div>
              <span className="type-card-desc">User/Role selector, wrapped in Action Row.</span>
            </div>
            <div className="type-select-card" onClick={() => handleSelect(8)}>
              <div className="type-card-top">
                <span className="type-card-name">Channel Select</span>
                <span className="type-number-pill">Type 8</span>
              </div>
              <span className="type-card-desc">Channel picker, wrapped in Action Row.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
