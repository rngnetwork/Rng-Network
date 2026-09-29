"use client";

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Type17Container } from '../../types';
import {
  buildDiscordV2MessagePayload,
  buildDiscordModalPayload,
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
      <div className="raw-editor-container" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Top Control Bar: Modes + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: '#1e1f22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px' }}>
          {/* Mode Switchers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`raw-mode-btn ${rawPayloadMode === 'message' ? 'active' : ''}`}
              onClick={() => handleModeChange('message')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                background: rawPayloadMode === 'message' ? 'var(--discord-cyan)' : 'rgba(255,255,255,0.06)',
                color: rawPayloadMode === 'message' ? '#000' : '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-message" />
              <span>Message V2 Payload</span>
            </button>
            <button
              type="button"
              className={`raw-mode-btn ${rawPayloadMode === 'modal' ? 'active' : ''}`}
              onClick={() => handleModeChange('modal')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                background: rawPayloadMode === 'modal' ? '#fbbf24' : 'rgba(255,255,255,0.06)',
                color: rawPayloadMode === 'modal' ? '#000' : '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-window-maximize" />
              <span>Modal Components View</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleCopyJson}
              title="Copy JSON Payload"
            >
              <i className="fa-regular fa-copy" />
              <span>Copy JSON</span>
            </button>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleApplyToCanvas}
              style={{ color: 'var(--discord-cyan)', borderColor: 'rgba(0, 168, 252, 0.4)' }}
              title="Parse & Apply JSON to Builder Canvas"
            >
              <i className="fa-solid fa-check" />
              <span>Apply to Canvas</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {parseError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-exclamation" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Monaco JSON Code Editor */}
        <div
          style={{
            background: '#1e1f22',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)'
          }}
        >
          <Editor
            height="580px"
            defaultLanguage="json"
            language="json"
            theme="vs-dark"
            value={rawJsonText}
            onChange={(val) => setUserEditedJson(val ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 14, bottom: 14 },
              suggest: {
                showWords: false
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
