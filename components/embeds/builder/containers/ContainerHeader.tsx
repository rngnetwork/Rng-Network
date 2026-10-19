"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ContainerHeaderProps {
  cIdx: number;
  totalContainers: number;
  accentColor: string;
  isSpoiler?: boolean;
  isAuthorCollapsed?: boolean;
  onUpdateAccent: (cIdx: number, color: string) => void;
  onToggleSpoiler: (cIdx: number) => void;
  onToggleAuthorCollapse: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onRemoveContainer: (cIdx: number) => void;
  onDragStart: (e: React.DragEvent, cIdx: number) => void;
}

const PRESET_ACCENTS = [
  { name: 'Cyan', hex: '#00A8FC' },
  { name: 'RNG Red', hex: '#E11D2E' },
  { name: 'Blurple', hex: '#5865F2' },
  { name: 'Green', hex: '#23A55A' },
  { name: 'Yellow', hex: '#FEE75C' },
  { name: 'Fuchsia', hex: '#EB459E' },
  { name: 'Dark Grey', hex: '#2B2D31' }
];

export function ContainerHeader({
  cIdx,
  totalContainers,
  accentColor,
  isSpoiler = false,
  isAuthorCollapsed = false,
  onUpdateAccent,
  onToggleSpoiler,
  onToggleAuthorCollapse,
  onMoveContainer,
  onRemoveContainer,
  onDragStart
}: ContainerHeaderProps) {
  const [mobileColorOpen, setMobileColorOpen] = useState(false);
  const mobileColorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileColorRef.current && !mobileColorRef.current.contains(e.target as Node)) {
        setMobileColorOpen(false);
      }
    }
    if (mobileColorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileColorOpen]);

  return (
    <div className="container-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Left: Drag Handle, Container Index & Accent Color Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          className="container-drag-handle"
          draggable
          onDragStart={(e) => onDragStart(e, cIdx)}
          title="Drag to reorder container"
          style={{ cursor: 'grab', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}
        >
          <i className="fa-solid fa-grip-vertical" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
            Container #{cIdx + 1}
          </span>
          <span className="type-scope-badge scope-msg" style={{ fontSize: '9px', padding: '1px 5px' }}>
            Type 17
          </span>
        </div>

        {/* Mobile Accent Color Trigger & Popover */}
        <div className="relative flex sm:hidden items-center ml-1.5" ref={mobileColorRef}>
          <button
            type="button"
            className="mobile-accent-trigger"
            onClick={() => setMobileColorOpen(!mobileColorOpen)}
            title="Choose Accent Color"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: accentColor || '#00A8FC',
              border: '2px solid rgba(255, 255, 255, 0.85)',
              boxShadow: '0 0 6px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              padding: 0
            }}
          />
          {mobileColorOpen && (
            <div
              className="mobile-accent-popover"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 60,
                background: '#232428',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.85)'
              }}
            >
              {PRESET_ACCENTS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: preset.hex,
                    border: accentColor.toLowerCase() === preset.hex.toLowerCase() ? '2px solid #fff' : '1px solid rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onClick={() => {
                    onUpdateAccent(cIdx, preset.hex);
                    setMobileColorOpen(false);
                  }}
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onUpdateAccent(cIdx, e.target.value)}
                style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '4px' }}
                title="Custom Color"
              />
            </div>
          )}
        </div>

        {/* Desktop Accent Color Presets */}
        <div className="hidden sm:flex items-center gap-1 ml-1.5">
          {PRESET_ACCENTS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              className="accent-preset-dot"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: preset.hex,
                border: accentColor.toLowerCase() === preset.hex.toLowerCase() ? '2px solid #fff' : '1px solid rgba(0,0,0,0.4)',
                cursor: 'pointer',
                padding: 0
              }}
              onClick={() => onUpdateAccent(cIdx, preset.hex)}
              title={preset.name}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => onUpdateAccent(cIdx, e.target.value)}
            style={{ width: '18px', height: '18px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '2px' }}
            title="Custom Accent Color"
          />
        </div>
      </div>

      {/* Right Controls: Spoiler, Author Collapse, Move Up/Down, Delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          className={`comp-tool-btn ${isSpoiler ? 'active' : ''}`}
          onClick={() => onToggleSpoiler(cIdx)}
          title="Toggle Container Spoiler Mask"
          style={{ fontSize: '11px', color: isSpoiler ? 'var(--discord-cyan)' : 'inherit' }}
        >
          <i className="fa-solid fa-eye-slash" />
        </button>

        <button
          type="button"
          className="comp-tool-btn"
          onClick={() => onToggleAuthorCollapse(cIdx)}
          title={isAuthorCollapsed ? 'Expand Author Fields' : 'Collapse Author Fields'}
          style={{ fontSize: '11px' }}
        >
          <i className={`fa-solid ${isAuthorCollapsed ? 'fa-user-pen' : 'fa-user-check'}`} />
        </button>

        {cIdx > 0 && (
          <button
            type="button"
            className="comp-tool-btn"
            onClick={() => onMoveContainer(cIdx, 'up')}
            title="Move Container Up"
            style={{ fontSize: '11px' }}
          >
            <i className="fa-solid fa-chevron-up" />
          </button>
        )}

        {cIdx < totalContainers - 1 && (
          <button
            type="button"
            className="comp-tool-btn"
            onClick={() => onMoveContainer(cIdx, 'down')}
            title="Move Container Down"
            style={{ fontSize: '11px' }}
          >
            <i className="fa-solid fa-chevron-down" />
          </button>
        )}

        <button
          type="button"
          className="comp-tool-btn btn-del"
          onClick={() => onRemoveContainer(cIdx)}
          title="Delete Container"
          style={{ fontSize: '11px' }}
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>
  );
}
