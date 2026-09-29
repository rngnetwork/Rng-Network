"use client";

import React, { useState } from 'react';
import { DiscordSeparatorComponent } from '../../../types';

interface SeparatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comp: DiscordSeparatorComponent;
  onSave: (updated: DiscordSeparatorComponent) => void;
}

export function SeparatorSettingsModal({
  isOpen,
  onClose,
  comp,
  onSave
}: SeparatorSettingsModalProps) {
  const [customId, setCustomId] = useState(comp.id || '');
  const [isDivider, setIsDivider] = useState(comp.divider !== false);
  const [spacing, setSpacing] = useState<1 | 2>(comp.spacing === 2 ? 2 : 1);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: DiscordSeparatorComponent = {
      ...comp,
      type: 14,
      id: customId.trim() || comp.id || `sep_${Date.now()}`,
      divider: isDivider,
      spacing
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      className="modal-overlay open"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backdropFilter: 'blur(10px)',
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'min(88vh, 650px)',
          margin: 'auto',
          background: '#313338',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            background: '#2b2d31',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-arrows-split-up-and-left" style={{ color: '#5865F2' }} />
            <span>Separator Settings (Type 14)</span>
          </div>
          <button className="btn-container-close" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px', overflowY: 'auto' }}>
          {/* Custom ID */}
          <div className="form-group">
            <label className="form-label">Custom ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. sep_section_divider"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>

          {/* Separator Type: Line vs Empty Space */}
          <div className="form-group">
            <label className="form-label">Separator Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`btn-style-chip ${isDivider ? 'active' : ''}`}
                onClick={() => setIsDivider(true)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-minus" />
                Line Divider
              </button>
              <button
                type="button"
                className={`btn-style-chip ${!isDivider ? 'active' : ''}`}
                onClick={() => setIsDivider(false)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-border-none" />
                Empty Space
              </button>
            </div>
          </div>

          {/* Spacing: Small (1, 4px) vs Large (2, 20px) */}
          <div className="form-group">
            <label className="form-label">Spacing</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`btn-style-chip ${spacing === 1 ? 'active' : ''}`}
                onClick={() => setSpacing(1)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Small (1 &bull; 4px)
              </button>
              <button
                type="button"
                className={`btn-style-chip ${spacing === 2 ? 'active' : ''}`}
                onClick={() => setSpacing(2)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Large (2 &bull; 20px)
              </button>
            </div>
          </div>

          {/* Separator Preview */}
          <div className="form-group">
            <label className="form-label">Separator Preview</label>
            <div
              style={{
                background: '#1e1f22',
                borderRadius: '6px',
                padding: '14px 16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', marginBottom: '8px' }}>
                Content above separator
              </div>
              {isDivider ? (
                <div style={{ padding: spacing === 2 ? '10px 0' : '4px 0', width: '100%' }}>
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      width: '100%'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: spacing === 2 ? '24px' : '14px',
                    width: '100%',
                    borderRadius: '4px',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    background:
                      'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04) 8px, transparent 8px, transparent 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
                    Empty Space ({spacing === 2 ? 'Large — 20px' : 'Small — 4px'})
                  </span>
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', marginTop: '8px' }}>
                Content below separator
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              type="button"
              className="btn-container-close"
              style={{ padding: '8px 16px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-dispatch-submit"
              style={{ width: 'auto', padding: '8px 20px' }}
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
