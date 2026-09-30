"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Type17Container } from '../../types';
import {
  buildDiscordV2MessagePayload,
  parseDiscordPayloadToState
} from '../../validation';

// SSR-safe dynamic Monaco Editor import
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '620px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#949ba4',
        fontSize: '13px',
        fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace"
      }}
    >
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px', color: '#EC4899' }} />
      <span>Loading Monaco JSON Editor...</span>
    </div>
  )
});

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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const defaultJsonText = React.useMemo(() => {
    const payload = buildDiscordV2MessagePayload(containers, messageContent);
    return JSON.stringify(payload, null, 2);
  }, [containers, messageContent]);

  const rawJsonText = userEditedJson ?? defaultJsonText;

  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      setToast({
        type: 'success',
        message: 'Successfully applied JSON payload to the Message Builder canvas!'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(`Failed to apply JSON: ${msg}`);
      setToast({
        type: 'error',
        message: `Syntax/Schema Error: ${msg}`
      });
    }
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '16px', overflowY: 'auto', position: 'relative' }}>
      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${toast.type === 'success' ? '#059669' : '#dc2626'}`,
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <i className={toast.type === 'success' ? 'fa-solid fa-circle-check text-emerald-400' : 'fa-solid fa-circle-exclamation text-red-400'} />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="raw-editor-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Top Control Bar: Title Badge + Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(14, 15, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-code" style={{ color: '#f472b6', fontSize: '13px' }} />
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>
              Discord Components V2 Payload
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleCopyJson}
              title="Copy JSON Payload"
              style={{
                borderRadius: '8px',
                padding: '7px 14px',
                background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)',
                borderColor: copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.12)',
                color: copied ? '#4ade80' : '#fff'
              }}
            >
              <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} />
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              className="btn-header-action"
              onClick={handleApplyToCanvas}
              style={{
                borderRadius: '8px',
                padding: '7px 16px',
                color: '#38bdf8',
                background: 'rgba(0, 168, 252, 0.12)',
                borderColor: 'rgba(0, 168, 252, 0.4)',
                boxShadow: '0 0 12px rgba(0, 168, 252, 0.2)'
              }}
              title="Parse & Apply JSON to Builder Canvas"
            >
              <i className="fa-solid fa-wand-magic-sparkles" />
              <span>Apply to Canvas</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {parseError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-circle-exclamation" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Monaco JSON Code Editor */}
        <div
          style={{
            background: '#0a0a0f',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
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
              padding: { top: 16, bottom: 48 },
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
