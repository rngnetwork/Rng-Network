import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiscordMarkdown } from '../display/DiscordMarkdown';

describe('DiscordMarkdown', () => {
  it('renders nested spoiler and link combination properly', () => {
    render(<DiscordMarkdown content="||[Visit RNG](https://rng.gg)||" />);

    const spoilerButton = screen.getByRole('button', { name: /spoiler/i });
    expect(spoilerButton).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Visit RNG' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://rng.gg');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders nested bold and underline combination properly', () => {
    const { container } = render(<DiscordMarkdown content="**__Bold Underline__**" />);

    const strongEl = container.querySelector('strong');
    expect(strongEl).toBeInTheDocument();

    const uEl = strongEl?.querySelector('u');
    expect(uEl).toBeInTheDocument();
    expect(uEl?.textContent).toBe('Bold Underline');
  });

  it('renders nested bold and italic combination properly', () => {
    const { container } = render(<DiscordMarkdown content="***Bold Italic***" />);

    const emEl = container.querySelector('em');
    expect(emEl).toBeInTheDocument();

    const strongEl = container.querySelector('strong');
    expect(strongEl).toBeInTheDocument();
    expect(strongEl?.textContent).toBe('Bold Italic');
  });

  it('renders strikethrough properly', () => {
    const { container } = render(<DiscordMarkdown content="~~Deleted Content~~" />);

    const sEl = container.querySelector('s');
    expect(sEl).toBeInTheDocument();
    expect(sEl?.textContent).toBe('Deleted Content');
  });

  it('reveals spoiler content on click toggle', () => {
    render(<DiscordMarkdown content="||Confidential Information||" />);

    const spoilerButton = screen.getByRole('button', { name: /spoiler/i });
    expect(spoilerButton.getAttribute('data-revealed')).toBe('false');

    fireEvent.click(spoilerButton);
    expect(spoilerButton.getAttribute('data-revealed')).toBe('true');
  });

  it('renders blockquote containing nested markdown formatting', () => {
    const { container } = render(<DiscordMarkdown content="> **Quoted Alert** with [Link](https://rng.gg)" />);

    const blockquote = container.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();

    const strong = blockquote?.querySelector('strong');
    expect(strong?.textContent).toBe('Quoted Alert');

    const link = blockquote?.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://rng.gg');
  });

  it('renders headers and inline code blocks', () => {
    const { container } = render(<DiscordMarkdown content={'# Main Title\n`const x = 10;`'} />);

    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Main Title');

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('const x = 10;');
  });

  it('does not parse indented text or indented list items as a code block', () => {
    const markdown = [
      '> When opening a ticket:',
      '>',
      '>        • Clearly describe your issue.',
      '>',
      '>        • Be patient while waiting for a response.',
    ].join('\n');

    const { container } = render(<DiscordMarkdown content={markdown} />);

    expect(container.querySelector('pre')).not.toBeInTheDocument();
    expect(container.querySelector('code')).not.toBeInTheDocument();
    expect(screen.getByText(/Clearly describe your issue/i)).toBeInTheDocument();
    expect(screen.getByText(/Be patient while waiting for a response/i)).toBeInTheDocument();
  });

  it('renders fenced code blocks correctly', () => {
    const markdown = '```js\nconst status = "operational";\n```';
    const { container } = render(<DiscordMarkdown content={markdown} />);

    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    const code = pre?.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toContain('const status = "operational";');
  });
});
