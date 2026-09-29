"use client";

import React, { useState, useEffect } from 'react';
import { Type17Container } from '../../types';
import {
  buildDiscordV2MessagePayload,
  buildDiscordModalPayload,
  validateDiscordV2Payload,
  parseDiscordPayloadToState
} from '../../validation';

interface RawTabProps {
  containers: Type17Container[];
  setContainers: React.Dispatch<React.SetStateAction<Type17Container[]>>;
  messageContent: string;
  setMessageContent: React.Dispatch<React.SetStateAction<string>>;
  onDirtyChange?: () => void;
}

export function RawTab({
  containers,
  setContainers,
  messageContent,
  setMessageContent,
  onDirtyChange
}: RawTabProps) {
  const [rawPayloadMode, setRawPayloadMode] = useState<'message' | 'modal'>('message');
  const [userEditedJson, setUserEditedJson] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const defaultJsonText = React.useMemo(() => {
    const payload = rawPayloadMode === 'message'
      ? buildDiscordV2MessagePayload(containers, messageContent)
      : buildDiscordModalPayload(containers);
    return JSON.stringify(payload, null, 2);
  }, [containers, messageContent, rawPayloadMode]);

  const rawJsonText = userEditedJson ?? defaultJsonText;

  // Validation calculation
  let parsedPayload: unknown = null;
  try {
    parsedPayload = JSON.parse(rawJsonText);
  } catch {
    // rawJsonText might be in progress of editing
  }

  const { rules, totalCount, isAllPassed } = validateDiscordV2Payload(
    parsedPayload || (rawPayloadMode === 'message' ? buildDiscordV2MessagePayload(containers, messageContent) : {})
  );

  const handleModeChange = (mode: 'message' | 'modal') => {
    setRawPayloadMode(mode);
    setUserEditedJson(null);
    setParseError(null);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonText).then(() => {
      alert('Discord Components V2 JSON payload copied to clipboard!');
    });
  };

  const handleApplyToCanvas = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      const { messageContent: newContent, containers: newContainers } = parseDiscordPayloadToState(parsed);

      setMessageContent(newContent);
      setContainers(newContainers);
      setUserEditedJson(null);
      setParseError(null);
      onDirtyChange?.();
      alert('Successfully applied JSON payload to the Message Builder canvas!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(`Failed to apply JSON: ${msg}`);
    }
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div className="raw-editor-container" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Live Discord Components V2 Validation Panel */}
        <div className="v2-validation-card" style={{ background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                className="v2-status-pill-valid"
                style={{
                  background: isAllPassed ? 'rgba(35, 165, 90, 0.15)' : 'rgba(235, 69, 158, 0.15)',
                  color: isAllPassed ? '#23a55a' : '#eb459e',
                  borderColor: isAllPassed ? 'rgba(35, 165, 90, 0.4)' : 'rgba(235, 69, 158, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className={`fa-solid ${isAllPassed ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
                <span>{isAllPassed ? '100% Valid Components V2' : 'V2 Schema Attention Needed'}</span>
              </span>

              <span style={{ fontSize: '11.5px', color: 'var(--discord-text-muted)' }}>
                Total Components: <strong style={{ color: totalCount > 40 ? '#ff5b69' : '#00a8fc' }}>{totalCount}</strong> / 40 (Limit: 40)
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="raw-payload-mode-tabs" style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`raw-mode-btn ${rawPayloadMode === 'message' ? 'active' : ''}`}
                onClick={() => handleModeChange('message')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: rawPayloadMode === 'message' ? 'var(--discord-cyan)' : 'rgba(255,255,255,0.05)',
                  color: rawPayloadMode === 'message' ? '#000' : '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Message V2 Payload
              </button>
              <button
                type="button"
                className={`raw-mode-btn ${rawPayloadMode === 'modal' ? 'active' : ''}`}
                onClick={() => handleModeChange('modal')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  background: rawPayloadMode === 'modal' ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                  color: rawPayloadMode === 'modal' ? '#000' : '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Modal Components View
              </button>
            </div>
          </div>

          {/* V2 Rule Checklist Tags */}
          <div className="v2-rule-checklist" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span className={`v2-rule-tag ${rules.flags ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.flags ? 'fa-check' : 'fa-xmark'}`} /> Flags: 32768 (IS_COMPONENTS_V2)
            </span>
            <span className={`v2-rule-tag ${rules.noLegacy ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.noLegacy ? 'fa-check' : 'fa-xmark'}`} /> No Legacy Content/Embeds/Polls
            </span>
            <span className={`v2-rule-tag ${rules.actionRowsWrapped ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.actionRowsWrapped ? 'fa-check' : 'fa-xmark'}`} /> Action Rows Wrapped
            </span>
            <span className={`v2-rule-tag ${rules.partialEmoji ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.partialEmoji ? 'fa-check' : 'fa-xmark'}`} /> Partial Emoji Objects
            </span>
            <span className={`v2-rule-tag ${rules.sectionAccessories ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.sectionAccessories ? 'fa-check' : 'fa-xmark'}`} /> Section Accessories
            </span>
            <span className={`v2-rule-tag ${rules.mediaObjects ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.mediaObjects ? 'fa-check' : 'fa-xmark'}`} /> Media Objects
            </span>
            <span className={`v2-rule-tag ${rules.attachmentProtocol ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.attachmentProtocol ? 'fa-check' : 'fa-xmark'}`} /> attachment:// Protocol
            </span>
            <span className={`v2-rule-tag ${rules.spacingEnums ? 'passed' : 'warning'}`}>
              <i className={`fa-solid ${rules.spacingEnums ? 'fa-check' : 'fa-xmark'}`} /> Spacing Integer Enums (1/2)
            </span>
          </div>
        </div>

        {/* Toolbar & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--color-foreground-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-file-code" style={{ color: 'var(--discord-cyan)' }} />
            <span>
              {rawPayloadMode === 'message'
                ? 'Discord Components V2 REST API Payload (flags: 32768, Type 17 Containers)'
                : 'Discord Modal Form Specification (Interaction Response Type 9)'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleCopyJson}
            >
              <i className="fa-regular fa-copy" /> Copy JSON
            </button>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleApplyToCanvas}
              style={{ color: 'var(--discord-cyan)', borderColor: 'rgba(0, 168, 252, 0.3)' }}
            >
              <i className="fa-solid fa-check" /> Apply to Canvas
            </button>
          </div>
        </div>

        {parseError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
            {parseError}
          </div>
        )}

        {/* Code Editor Container */}
        <div style={{ background: '#111214', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
          <textarea
            id="raw-components-json"
            className="raw-textarea"
            style={{
              width: '100%',
              minHeight: '420px',
              background: 'transparent',
              color: '#4ade80',
              fontFamily: 'monospace',
              fontSize: '12.5px',
              lineHeight: '1.5',
              padding: '14px',
              border: 'none',
              outline: 'none',
              resize: 'vertical'
            }}
            spellCheck={false}
            value={rawJsonText}
            onChange={(e) => setUserEditedJson(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
