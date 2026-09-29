"use client";

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Type17Container } from '../../types';
import {
  buildDiscordV2MessagePayload,
  parseDiscordPayloadToState
} from '../../validation';

interface RawTabProps {
  containers: Type17Container[];
  setContainers: React.Dispatch<React.SetStateAction<Type17Container[]>>;
  messageContent?: string;
  setMessageContent?: React.Dispatch<React.SetStateAction<string>>;
  onDirtyChange?: () => void;
}

export function RawTab({
  containers,
  setContainers,
  messageContent,
  setMessageContent,
  onDirtyChange
}: RawTabProps) {
  const [userEditedJson, setUserEditedJson] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const defaultJsonText = React.useMemo(() => {
    const payload = buildDiscordV2MessagePayload(containers, messageContent);
    return JSON.stringify(payload, null, 2);
  }, [containers, messageContent]);

  const rawJsonText = userEditedJson ?? defaultJsonText;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonText).then(() => {
      alert('Discord Components V2 JSON payload copied to clipboard!');
    });
  };

  const handleApplyToCanvas = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      const { messageContent: newContent, containers: newContainers } = parseDiscordPayloadToState(parsed);

      if (setMessageContent) {
        setMessageContent(newContent);
      }
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
      <div className="raw-editor-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Top Control Bar: Title Badge + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: '#1e1f22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-code" style={{ color: 'var(--discord-cyan)' }} />
              <span>Discord Components V2 Payload (flags: 32768)</span>
            </span>
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
            height="620px"
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
              scrollBeyondLastLine: true,
              stickyScroll: { enabled: false },
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 14, bottom: 48 },
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
