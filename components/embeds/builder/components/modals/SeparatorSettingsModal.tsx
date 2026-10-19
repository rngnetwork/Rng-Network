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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(139, 92, 246, 0.12)'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-arrows-split-up-and-left" style={{ color: '#c4b5fd', fontSize: '14px' }} />
            </div>
            <span>Separator Settings</span>
            <span className="component-modal-badge purple">Type 14</span>
          </div>
          <button className="btn-container-close" onClick={onClose} type="button">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Custom ID */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Custom ID</span>
              <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: 400 }}>Unique identifier</span>
            </label>
            <input
              type="text"
              className="form-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              placeholder="e.g. sep_section_divider"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>

          {/* Separator Type: Line vs Empty Space */}
          <div className="form-group">
            <label className="form-label">Separator Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                className={`modal-radio-card ${isDivider ? 'active' : ''}`}
                onClick={() => setIsDivider(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDivider ? '#c4b5fd' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                  <i className="fa-solid fa-minus" />
                  <span>Line Divider</span>
                </div>
                <span style={{ fontSize: '11px', color: '#949ba4', lineHeight: 1.3 }}>
                  Renders a visible 1px horizontal rule
                </span>
              </div>
              <div
                className={`modal-radio-card ${!isDivider ? 'active' : ''}`}
                onClick={() => setIsDivider(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !isDivider ? '#c4b5fd' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                  <i className="fa-solid fa-border-none" />
                  <span>Empty Space</span>
                </div>
                <span style={{ fontSize: '11px', color: '#949ba4', lineHeight: 1.3 }}>
                  Invisible spacing gap between components
                </span>
              </div>
            </div>
          </div>

          {/* Spacing: Small (1, 4px) vs Large (2, 20px) */}
          <div className="form-group">
            <label className="form-label">Spacing Interval</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                className={`modal-radio-card ${spacing === 1 ? 'active' : ''}`}
                onClick={() => setSpacing(1)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: spacing === 1 ? '#c4b5fd' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                  <i className="fa-solid fa-compress" />
                  <span>Small Spacing</span>
                </div>
                <span style={{ fontSize: '11px', color: '#949ba4' }}>
                  Spacing 1 (4px padding)
                </span>
              </div>
              <div
                className={`modal-radio-card ${spacing === 2 ? 'active' : ''}`}
                onClick={() => setSpacing(2)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: spacing === 2 ? '#c4b5fd' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                  <i className="fa-solid fa-expand" />
                  <span>Large Spacing</span>
                </div>
                <span style={{ fontSize: '11px', color: '#949ba4' }}>
                  Spacing 2 (20px padding)
                </span>
              </div>
            </div>
          </div>

          {/* Separator Preview */}
          <div className="form-group">
            <label className="form-label">Live Simulation Preview</label>
            <div
              style={{
                background: '#1e1f22',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', marginBottom: '8px' }}>
                Content block above separator
              </div>
              {isDivider ? (
                <div style={{ padding: spacing === 2 ? '12px 0' : '4px 0', width: '100%' }}>
                  <div
                    style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.18)',
                      width: '100%'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: spacing === 2 ? '26px' : '14px',
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
                Content block below separator
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer" style={{ padding: '14px 0 0 0', background: 'transparent' }}>
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-btn-save"
              onClick={handleSave}
            >
              <i className="fa-solid fa-check" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
