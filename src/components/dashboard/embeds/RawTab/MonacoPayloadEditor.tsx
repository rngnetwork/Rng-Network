'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Check, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import type { DiscordV2MessagePayload, MessageBuilderState } from '@/lib/model/embed';
import { parseDiscordPayloadToState } from '../useEmbedBuilderReducer';
import { Button } from '@/components/common/input/Button';
import { Badge } from '@/components/common/feedback/Badge';

export interface MonacoPayloadEditorProps {
  compiledPayload: DiscordV2MessagePayload;
  onApplyParsedState: (
    parsed: Pick<MessageBuilderState, 'message' | 'type17Containers'>
  ) => void;
}

export const MonacoPayloadEditor: React.FC<MonacoPayloadEditorProps> = ({
  compiledPayload,
  onApplyParsedState,
}) => {
  const [prevCompiledPayload, setPrevCompiledPayload] = useState(compiledPayload);
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(compiledPayload, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (compiledPayload !== prevCompiledPayload) {
    setPrevCompiledPayload(compiledPayload);
    setJsonText(JSON.stringify(compiledPayload, null, 2));
    setParseError(null);
  }

  const handleApplyToBuilder = () => {
    try {
      const parsedObj = JSON.parse(jsonText) as Record<string, unknown>;
      if (parsedObj.flags !== 32768) {
        setParseError(
          'Discord Components V2 payload requires top-level "flags": 32768.'
        );
        return;
      }
      const nextState = parseDiscordPayloadToState(parsedObj);
      setParseError(null);
      onApplyParsedState(nextState);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Invalid JSON syntax.'
      );
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard write unavailable
    }
  };

  return (
    <div className="rounded-apple-xl bg-surface-card border border-white/[0.08] overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge variant="crimson" size="sm">
            Discord API v10 Schema
          </Badge>
          <span className="text-xs font-mono text-zinc-400">
            flags: 32768 (IS_COMPONENTS_V2)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={handleApplyToBuilder}
          >
            Sync JSON to Visual Canvas
          </Button>
        </div>
      </div>

      {parseError && (
        <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      <div className="h-[500px] w-full bg-[#1E1E1E]">
        <Editor
          height="500px"
          defaultLanguage="json"
          theme="vs-dark"
          value={jsonText}
          onChange={(val) => {
            setJsonText(val ?? '');
            if (parseError) setParseError(null);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};
