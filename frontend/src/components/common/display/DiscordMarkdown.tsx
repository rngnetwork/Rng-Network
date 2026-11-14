'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

export interface DiscordMarkdownProps {
  content: string;
  className?: string;
}

const DiscordSpoiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setRevealed(!revealed)}
      aria-label="Spoiler"
      data-revealed={String(revealed)}
      className={`px-1 py-0.5 rounded transition-all cursor-pointer inline-block text-left align-baseline ${
        revealed
          ? 'bg-white/10 text-[#DBDEE1]'
          : 'bg-[#1E1F22] hover:bg-[#2B2D31] text-transparent select-none'
      }`}
    >
      <span className={revealed ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}>
        {children}
      </span>
    </button>
  );
};

function remarkDiscordSyntax() {
  return (tree: any) => {
    visit(tree, 'strong', (node, index, parent) => {
      if (node.position && parent && typeof index === 'number') {
        node.data = {
          ...node.data,
          hName: 'u',
          hProperties: { className: 'underline decoration-1 underline-offset-2' },
        };
      }
    });

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const value: string = node.value;
      const regex = /(\|\|[\s\S]+?\|\|)|(<(a)?:([a-zA-Z0-9_]+):([0-9]+)>)/g;
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const newNodes: any[] = [];

      while ((match = regex.exec(value)) !== null) {
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: value.slice(lastIndex, match.index),
          });
        }

        if (match[1]) {
          const spoilerContent = match[1].slice(2, -2);
          newNodes.push({
            type: 'discordSpoiler',
            data: { hName: 'discord-spoiler' },
            children: [{ type: 'text', value: spoilerContent }],
          });
        } else if (match[2]) {
          newNodes.push({
            type: 'discordEmoji',
            data: {
              hName: 'discord-emoji',
              hProperties: {
                animated: match[3] === 'a' ? 'true' : 'false',
                name: match[4],
                id: match[5],
              },
            },
          });
        }

        lastIndex = regex.lastIndex;
      }

      if (newNodes.length > 0) {
        if (lastIndex < value.length) {
          newNodes.push({
            type: 'text',
            value: value.slice(lastIndex),
          });
        }
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length;
      }
    });
  };
}

const discordComponents: Components & Record<string, any> = {
  'discord-spoiler': ({ children }: { children: React.ReactNode }) => (
    <DiscordSpoiler>{children}</DiscordSpoiler>
  ),
  'discord-emoji': ({ animated, name, id }: { animated: string; name: string; id: string }) => (
    <Image
      src={`https://discordapp.com{id}.${animated === 'true' ? 'gif' : 'webp'}?size=48&quality=lossless`}
      alt={`:${name}:`}
      title={`:${name}:`}
      width={20}
      height={20}
      unoptimized
      className="inline-block w-5 h-5 align-middle mx-0.5 object-contain"
    />
  ),
  s: ({ children }) => <s className="line-through text-text-tertiary">{children}</s>,
  del: ({ children }) => <s className="line-through text-text-tertiary">{children}</s>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#DBDEE1]">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#00A8FC] hover:underline cursor-pointer"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-(\w+)/.test(className || '') || String(children).includes('\n');
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-[#1E1F22] text-[#DBDEE1] font-mono text-[12px]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="p-3 my-1.5 rounded-apple-md bg-[#1E1F22] border border-white/5 font-mono text-xs text-[#DBDEE1] overflow-x-auto leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-3.5 my-1 border-l-4 border-[#4E5058] text-[#B5BAC1]">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg md:text-xl font-bold text-white mt-2 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base md:text-lg font-bold text-white mt-1.5 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm md:text-base font-bold text-white mt-1 mb-0.5">{children}</h3>
  ),
  p: ({ children }) => <div className="min-h-[1.25rem]">{children}</div>,
};

export const DiscordMarkdown: React.FC<DiscordMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`text-[14px] leading-[1.375rem] text-[#DBDEE1] break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDiscordSyntax]}
        components={discordComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
