'use client';

import React, { useState } from 'react';
import { DISCORD_SAFE_URL_REGEX } from '@/lib/model/embed';

export interface DiscordTextDisplayPreviewProps {
  content: string;
  className?: string;
}

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'spoiler'; value: string }
  | { kind: 'link'; label: string; href: string };

function tokenizeInlineMarkdown(line: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\|\|[^|]+\|\||\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = pattern.exec(line);

  while (match !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: 'text',
        value: line.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ kind: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ kind: 'italic', value: raw.slice(1, -1) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ kind: 'code', value: raw.slice(1, -1) });
    } else if (raw.startsWith('||') && raw.endsWith('||')) {
      tokens.push({ kind: 'spoiler', value: raw.slice(2, -2) });
    } else if (raw.startsWith('[')) {
      const closeBracket = raw.indexOf('](');
      if (closeBracket !== -1 && raw.endsWith(')')) {
        const label = raw.slice(1, closeBracket);
        const href = raw.slice(closeBracket + 2, -1).trim();
        if (DISCORD_SAFE_URL_REGEX.test(href)) {
          tokens.push({ kind: 'link', label, href });
        } else {
          tokens.push({ kind: 'text', value: label });
        }
      } else {
        tokens.push({ kind: 'text', value: raw });
      }
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(line);
  }

  if (lastIndex < line.length) {
    tokens.push({ kind: 'text', value: line.slice(lastIndex) });
  }

  return tokens;
}

export const DiscordTextDisplayPreview: React.FC<
  DiscordTextDisplayPreviewProps
> = ({ content, className = '' }) => {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  if (!content) return null;

  const lines = content.split('\n');

  const renderInline = (lineText: string, lineKey: string) => {
    const tokens = tokenizeInlineMarkdown(lineText);
    return tokens.map((tok, idx) => {
      const key = `${lineKey}_${idx}`;
      if (tok.kind === 'bold') {
        return (
          <strong key={key} className="font-semibold text-white">
            {tok.value}
          </strong>
        );
      }
      if (tok.kind === 'italic') {
        return (
          <em key={key} className="italic text-[#DBDEE1]">
            {tok.value}
          </em>
        );
      }
      if (tok.kind === 'code') {
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-[#1E1F22] text-[#DBDEE1] font-mono text-[12px]"
          >
            {tok.value}
          </code>
        );
      }
      if (tok.kind === 'spoiler') {
        const revealed = Boolean(revealedSpoilers[key]);
        return (
          <button
            key={key}
            type="button"
            onClick={() =>
              setRevealedSpoilers((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            className={`px-1 rounded transition-colors ${
              revealed
                ? 'bg-white/10 text-[#DBDEE1]'
                : 'bg-[#1E1F22] text-transparent select-none'
            }`}
          >
            {tok.value}
          </button>
        );
      }
      if (tok.kind === 'link') {
        return (
          <a
            key={key}
            href={tok.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00A8FC] hover:underline"
          >
            {tok.label}
          </a>
        );
      }
      return <React.Fragment key={key}>{tok.value}</React.Fragment>;
    });
  };

  return (
    <div
      className={`flex flex-col gap-1 text-[14px] leading-[1.375rem] text-[#DBDEE1] break-words ${className}`}
    >
      {lines.map((line, idx) => {
        const lineKey = `l_${idx}`;
        if (line.startsWith('### ')) {
          return (
            <h3
              key={lineKey}
              className="text-[15px] font-bold text-white leading-snug mt-1"
            >
              {renderInline(line.slice(4), lineKey)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2
              key={lineKey}
              className="text-[17px] font-bold text-white leading-snug mt-1"
            >
              {renderInline(line.slice(3), lineKey)}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1
              key={lineKey}
              className="text-[20px] font-bold text-white leading-snug mt-1"
            >
              {renderInline(line.slice(2), lineKey)}
            </h1>
          );
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote
              key={lineKey}
              className="pl-3 border-l-4 border-[#4E5058] text-[#B5BAC1]"
            >
              {renderInline(line.slice(2), lineKey)}
            </blockquote>
          );
        }
        if (line.trim().length === 0) {
          return <div key={lineKey} className="h-2" />;
        }
        return <p key={lineKey}>{renderInline(line, lineKey)}</p>;
      })}
    </div>
  );
};
