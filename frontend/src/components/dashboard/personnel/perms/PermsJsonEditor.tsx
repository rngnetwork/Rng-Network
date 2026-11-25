'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Wand2, Search } from 'lucide-react';
import { Button } from '@/components/common/input/Button';
import {
  findJsonSearchMatches,
  renderHighlightedLine,
} from './permsJsonSearchHelper';

export interface PermsJsonEditorProps {
  jsonText: string;
  onChange: (val: string) => void;
  onApplyParsedJson?: () => void;
  searchQuery?: string;
}

export const PermsJsonEditor: React.FC<PermsJsonEditorProps> = ({
  jsonText,
  onChange,
  onApplyParsedJson,
  searchQuery = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightOverlayRef = useRef<HTMLDivElement>(null);

  const parseError = useMemo<string | null>(() => {
    try {
      if (jsonText.trim()) {
        JSON.parse(jsonText);
      }
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Invalid JSON syntax';
    }
  }, [jsonText]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (highlightOverlayRef.current) {
        highlightOverlayRef.current.scrollTop = scrollTop;
        highlightOverlayRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  const lines = useMemo(() => jsonText.split('\n'), [jsonText]);
  const linesCount = lines.length;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const { matchCount, matchingLineIndices } = useMemo(
    () => findJsonSearchMatches(lines, searchQuery),
    [lines, searchQuery]
  );

  useEffect(() => {
    if (!normalizedQuery || !textareaRef.current) return;

    const firstMatchIndex = lines.findIndex((l) =>
      l.toLowerCase().includes(normalizedQuery)
    );

    if (firstMatchIndex !== -1) {
      const targetScrollTop = Math.max(0, firstMatchIndex * 20 - 40);
      textareaRef.current.scrollTop = targetScrollTop;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = targetScrollTop;
      }
      if (highlightOverlayRef.current) {
        highlightOverlayRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [normalizedQuery, lines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextText =
        jsonText.substring(0, start) + '  ' + jsonText.substring(end);

      onChange(nextText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
            start + 2;
        }
      }, 0);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      onApplyParsedJson?.();
    } catch {
      // parseError is already derived via useMemo
    }
  };

  return (
    <div className="flex flex-col bg-[#0E0E12] border border-white/[0.08] rounded-apple-xl overflow-hidden shadow-apple-card">
      {/* Editor Sub-Header Toolbar */}
      <div className="px-3.5 py-2 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 text-xs shrink-0">
        <div className="flex items-center gap-3">
          {parseError ? (
            <div className="flex items-center gap-1.5 text-accent-danger font-mono text-[11px]">
              <AlertCircle size={13} className="shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-md">{parseError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-accent-success font-mono text-[11px]">
              <CheckCircle2 size={13} className="shrink-0" />
              <span>Valid JSON Schema</span>
            </div>
          )}

          {normalizedQuery && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand-red/15 border border-brand-red/30 text-brand-red text-[11px] font-mono">
              <Search size={11} />
              <span>
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
            {linesCount} lines · {jsonText.length} chars
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleFormatJson}
            leftIcon={<Wand2 size={12} />}
            className="text-[11px] h-6 px-2"
          >
            Format JSON
          </Button>
        </div>
      </div>

      {/* Editor Workspace with Line Numbers and Search Highlight Overlay */}
      <div className="relative flex h-[500px] overflow-hidden bg-[#121216]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-11 py-3 pr-2 text-right font-mono text-[11px] text-zinc-600 bg-black/40 select-none overflow-hidden border-r border-white/[0.06] shrink-0"
        >
          {lines.map((_, i) => {
            const num = i + 1;
            const isMatchedLine = matchingLineIndices.has(i);
            return (
              <div
                key={num}
                className={`leading-5 h-5 transition-colors ${
                  isMatchedLine ? 'text-brand-red font-bold bg-brand-red/20' : ''
                }`}
              >
                {num}
              </div>
            );
          })}
        </div>

        {/* Highlight Overlay Layer (Synchronized under textarea) */}
        <div
          ref={highlightOverlayRef}
          aria-hidden="true"
          className="absolute left-11 right-0 top-0 bottom-0 p-3 font-mono text-xs leading-5 whitespace-pre pointer-events-none overflow-hidden select-none"
        >
          {normalizedQuery &&
            lines.map((line, idx) =>
              renderHighlightedLine(line, normalizedQuery, idx)
            )}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={jsonText}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="relative z-10 flex-1 w-full h-full p-3 font-mono text-xs text-zinc-200 bg-transparent resize-none outline-none leading-5 whitespace-pre focus:ring-0 border-none caret-white selection:bg-brand-red/30"
          aria-label="JSON Schema Editor"
        />
      </div>
    </div>
  );
};
