'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import SimpleMarkdown from 'simple-markdown';

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

const discordRules: SimpleMarkdown.ParserRules & SimpleMarkdown.OutputRules<SimpleMarkdown.ReactOutputRule> = {
  ...SimpleMarkdown.defaultRules,

  spoiler: {
    order: SimpleMarkdown.defaultRules.strong.order - 0.5,
    match: SimpleMarkdown.inlineRegex(/^\|\|([\s\S]+?)\|\|/),
    parse: (capture: SimpleMarkdown.Capture, parse: SimpleMarkdown.Parser, state: SimpleMarkdown.State) => ({
      content: parse(capture[1], state),
    }),
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <DiscordSpoiler key={state.key}>{output(node.content, state)}</DiscordSpoiler>
    ),
  },

  underline: {
    order: SimpleMarkdown.defaultRules.em.order - 0.5,
    match: SimpleMarkdown.inlineRegex(/^__([\s\S]+?)__(?!_)/),
    parse: (capture: SimpleMarkdown.Capture, parse: SimpleMarkdown.Parser, state: SimpleMarkdown.State) => ({
      content: parse(capture[1], state),
    }),
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <u key={state.key} className="underline decoration-1 underline-offset-2">
        {output(node.content, state)}
      </u>
    ),
  },

  strikethrough: {
    order: SimpleMarkdown.defaultRules.em.order - 0.2,
    match: SimpleMarkdown.inlineRegex(/^~~([\s\S]+?)~~/),
    parse: (capture: SimpleMarkdown.Capture, parse: SimpleMarkdown.Parser, state: SimpleMarkdown.State) => ({
      content: parse(capture[1], state),
    }),
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <s key={state.key} className="line-through text-text-tertiary">
        {output(node.content, state)}
      </s>
    ),
  },

  strong: {
    ...SimpleMarkdown.defaultRules.strong,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <strong key={state.key} className="font-semibold text-white">
        {output(node.content, state)}
      </strong>
    ),
  },

  em: {
    ...SimpleMarkdown.defaultRules.em,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <em key={state.key} className="italic text-[#DBDEE1]">
        {output(node.content, state)}
      </em>
    ),
  },

  link: {
    ...SimpleMarkdown.defaultRules.link,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <a
        key={state.key}
        href={node.target}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00A8FC] hover:underline cursor-pointer"
      >
        {output(node.content, state)}
      </a>
    ),
  },

  autolink: {
    ...SimpleMarkdown.defaultRules.autolink,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <a
        key={state.key}
        href={node.target}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00A8FC] hover:underline cursor-pointer"
      >
        {output(node.content, state)}
      </a>
    ),
  },

  inlineCode: {
    ...SimpleMarkdown.defaultRules.inlineCode,
    react: (node: SimpleMarkdown.SingleASTNode, _output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <code
        key={state.key}
        className="px-1.5 py-0.5 rounded bg-[#1E1F22] text-[#DBDEE1] font-mono text-[12px]"
      >
        {node.content}
      </code>
    ),
  },

  codeBlock: {
    ...SimpleMarkdown.defaultRules.codeBlock,
    match: () => null,
  },

  fence: {
    ...SimpleMarkdown.defaultRules.fence,
    parse: (capture: SimpleMarkdown.Capture) => ({
      lang: capture[2] || undefined,
      content: capture[3],
    }),
    react: (node: SimpleMarkdown.SingleASTNode, _output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <pre
        key={state.key}
        className="p-3 my-1.5 rounded-apple-md bg-[#1E1F22] border border-white/5 font-mono text-xs text-[#DBDEE1] overflow-x-auto leading-relaxed"
      >
        <code>{node.content}</code>
      </pre>
    ),
  },

  blockQuote: {
    ...SimpleMarkdown.defaultRules.blockQuote,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <blockquote
        key={state.key}
        className="pl-3.5 my-1 border-l-4 border-[#4E5058] text-[#B5BAC1]"
      >
        {output(node.content, state)}
      </blockquote>
    ),
  },

  heading: {
    order: SimpleMarkdown.defaultRules.heading.order,
    match: SimpleMarkdown.blockRegex(/^ *(#{1,3}) +([^\n]+?)#* *(?:\n|$)/),
    parse: (capture: SimpleMarkdown.Capture, parse: SimpleMarkdown.Parser, state: SimpleMarkdown.State) => ({
      level: capture[1].length,
      content: parse(capture[2].trim(), state),
    }),
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => {
      if (node.level === 1) {
        return (
          <h1 key={state.key} className="text-lg md:text-xl font-bold text-white mt-2 mb-1">
            {output(node.content, state)}
          </h1>
        );
      }
      if (node.level === 2) {
        return (
          <h2 key={state.key} className="text-base md:text-lg font-bold text-white mt-1.5 mb-1">
            {output(node.content, state)}
          </h2>
        );
      }
      return (
        <h3 key={state.key} className="text-sm md:text-base font-bold text-white mt-1 mb-0.5">
          {output(node.content, state)}
        </h3>
      );
    },
  },

  paragraph: {
    ...SimpleMarkdown.defaultRules.paragraph,
    react: (node: SimpleMarkdown.SingleASTNode, output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <div key={state.key} className="min-h-[1.25rem]">
        {output(node.content, state)}
      </div>
    ),
  },

  discordEmoji: {
    order: SimpleMarkdown.defaultRules.text.order - 0.5,
    match: SimpleMarkdown.inlineRegex(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>/),
    parse: (capture: SimpleMarkdown.Capture) => ({
      animated: Boolean(capture[1]),
      name: capture[2],
      id: capture[3],
    }),
    react: (node: SimpleMarkdown.SingleASTNode, _output: SimpleMarkdown.Output<React.ReactNode>, state: SimpleMarkdown.State) => (
      <Image
        key={state.key}
        src={`https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? 'gif' : 'webp'}?size=48&quality=lossless`}
        alt={`:${node.name}:`}
        title={`:${node.name}:`}
        width={20}
        height={20}
        unoptimized
        className="inline-block w-5 h-5 align-middle mx-0.5 object-contain"
      />
    ),
  },
};

const rawParser = SimpleMarkdown.parserFor(discordRules);
const reactOutputter = SimpleMarkdown.outputFor(discordRules, 'react');

export const DiscordMarkdown: React.FC<DiscordMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  try {
    const ast = rawParser(content + '\n\n', { inline: false });
    return (
      <div className={`text-[14px] leading-[1.375rem] text-[#DBDEE1] break-words ${className}`}>
        {reactOutputter(ast)}
      </div>
    );
  } catch {
    return <div className={`text-[14px] text-[#DBDEE1] break-words ${className}`}>{content}</div>;
  }
};
