import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiscordMarkdown } from '../display/DiscordMarkdown';

describe('DiscordMarkdown', () => {
  // ===========================================================================
  // SECTION 1: Markdown Combination Syntaxes (20+ Tests)
  // ===========================================================================

  describe('Combination Syntaxes', () => {
    it('renders nested bold and underline combination properly (**__...__**)', () => {
      const { container } = render(<DiscordMarkdown content="**__Bold Underline__**" />);

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();

      const uEl = strongEl?.querySelector('u');
      expect(uEl).toBeInTheDocument();
      expect(uEl?.textContent).toBe('Bold Underline');
    });

    it('renders nested underline and bold combination properly (__**...**__)', () => {
      const { container } = render(<DiscordMarkdown content="__**Underline Bold**__" />);

      const uEl = container.querySelector('u');
      expect(uEl).toBeInTheDocument();

      const strongEl = uEl?.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl?.textContent).toBe('Underline Bold');
    });

    it('renders nested bold and italic with asterisks (***...***)', () => {
      const { container } = render(<DiscordMarkdown content="***Bold Italic***" />);

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(container.textContent).toContain('Bold Italic');
    });

    it('renders nested bold and italic with underscores (**_..._**)', () => {
      const { container } = render(<DiscordMarkdown content="**_Bold Italic Underscore_**" />);

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();

      const emEl = strongEl?.querySelector('em');
      expect(emEl).toBeInTheDocument();
      expect(emEl?.textContent).toBe('Bold Italic Underscore');
    });

    it('renders nested italic and bold with underscores (_**...**_)', () => {
      const { container } = render(<DiscordMarkdown content="_**Italic Bold**_" />);

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();

      const strongEl = emEl?.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl?.textContent).toBe('Italic Bold');
    });

    it('renders nested italic and underline combination (*__...__*)', () => {
      const { container } = render(<DiscordMarkdown content="*__Italic Underline__*" />);

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();

      const uEl = emEl?.querySelector('u');
      expect(uEl).toBeInTheDocument();
      expect(uEl?.textContent).toBe('Italic Underline');
    });

    it('renders nested underline and italic combination (__*...*__)', () => {
      const { container } = render(<DiscordMarkdown content="__*Underline Italic*__" />);

      const uEl = container.querySelector('u');
      expect(uEl).toBeInTheDocument();

      const emEl = uEl?.querySelector('em');
      expect(emEl).toBeInTheDocument();
      expect(emEl?.textContent).toBe('Underline Italic');
    });

    it('renders nested bold and strikethrough combination (**~~...~~**)', () => {
      const { container } = render(<DiscordMarkdown content="**~~Bold Strikethrough~~**" />);

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();

      const sEl = strongEl?.querySelector('s');
      expect(sEl).toBeInTheDocument();
      expect(sEl?.textContent).toBe('Bold Strikethrough');
    });

    it('renders nested strikethrough and bold combination (~~**...**~~)', () => {
      const { container } = render(<DiscordMarkdown content="~~**Strikethrough Bold**~~" />);

      const sEl = container.querySelector('s');
      expect(sEl).toBeInTheDocument();

      const strongEl = sEl?.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl?.textContent).toBe('Strikethrough Bold');
    });

    it('renders nested underline and strikethrough combination (__~~...~~__)', () => {
      const { container } = render(<DiscordMarkdown content="__~~Underline Strikethrough~~__" />);

      const uEl = container.querySelector('u');
      expect(uEl).toBeInTheDocument();

      const sEl = uEl?.querySelector('s');
      expect(sEl).toBeInTheDocument();
      expect(sEl?.textContent).toBe('Underline Strikethrough');
    });

    it('renders nested strikethrough and underline combination (~~__...__~~)', () => {
      const { container } = render(<DiscordMarkdown content="~~__Strikethrough Underline__~~" />);

      const sEl = container.querySelector('s');
      expect(sEl).toBeInTheDocument();

      const uEl = sEl?.querySelector('u');
      expect(uEl).toBeInTheDocument();
      expect(uEl?.textContent).toBe('Strikethrough Underline');
    });

    it('renders triple combination: bold, italic, and underline (***__...__***)', () => {
      const { container } = render(<DiscordMarkdown content="***__Bold Italic Underline__***" />);

      expect(container.querySelector('strong')).toBeInTheDocument();
      expect(container.querySelector('em')).toBeInTheDocument();
      expect(container.querySelector('u')).toBeInTheDocument();
      expect(container.textContent).toContain('Bold Italic Underline');
    });

    it('renders nested spoiler and bold combination (||**...**||)', () => {
      const { container } = render(<DiscordMarkdown content="||**Secret Bold**||" />);

      const spoilerBtn = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerBtn).toBeInTheDocument();

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl?.textContent).toBe('Secret Bold');
    });

    it('renders nested spoiler and italic combination (||*...*||)', () => {
      const { container } = render(<DiscordMarkdown content="||*Secret Italic*||" />);

      const spoilerBtn = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerBtn).toBeInTheDocument();

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();
      expect(emEl?.textContent).toBe('Secret Italic');
    });

    it('renders nested spoiler and underline combination (||__...__||)', () => {
      const { container } = render(<DiscordMarkdown content="||__Secret Underline__||" />);

      const spoilerBtn = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerBtn).toBeInTheDocument();

      const uEl = container.querySelector('u');
      expect(uEl).toBeInTheDocument();
      expect(uEl?.textContent).toBe('Secret Underline');
    });

    it('renders nested spoiler and strikethrough combination (||~~...~~||)', () => {
      const { container } = render(<DiscordMarkdown content="||~~Secret Strikethrough~~||" />);

      const spoilerBtn = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerBtn).toBeInTheDocument();

      const sEl = container.querySelector('s');
      expect(sEl).toBeInTheDocument();
      expect(sEl?.textContent).toBe('Secret Strikethrough');
    });

    it('renders nested spoiler and link combination properly (||[...](...)||)', () => {
      render(<DiscordMarkdown content="||[Visit RNG](https://rng.gg)||" />);

      const spoilerButton = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerButton).toBeInTheDocument();

      const link = screen.getByRole('link', { name: 'Visit RNG' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://rng.gg');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders nested spoiler with custom emoji (||<:pepe:123456789>||)', () => {
      render(<DiscordMarkdown content="||<:pepe:123456789>||" />);

      const spoilerButton = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerButton).toBeInTheDocument();

      const emojiImg = screen.getByRole('img', { name: ':pepe:' });
      expect(emojiImg).toBeInTheDocument();
      expect(emojiImg).toHaveAttribute(
        'src',
        'https://cdn.discordapp.com/emojis/123456789.webp?size=48&quality=lossless'
      );
    });

    it('renders blockquote containing nested markdown formatting', () => {
      const { container } = render(
        <DiscordMarkdown content="> **Quoted Alert** with [Link](https://rng.gg)" />
      );

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();

      const strong = blockquote?.querySelector('strong');
      expect(strong?.textContent).toBe('Quoted Alert');

      const link = blockquote?.querySelector('a');
      expect(link).toHaveAttribute('href', 'https://rng.gg');
    });

    it('renders blockquote containing spoiler (> ||Hidden Quote||)', () => {
      const { container } = render(<DiscordMarkdown content="> ||Hidden Quote||" />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();

      const spoilerBtn = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerBtn).toBeInTheDocument();
      expect(spoilerBtn.textContent).toContain('Hidden Quote');
    });

    it('renders list items with nested bold and underline formatting', () => {
      const markdown = '- **Rule 1**: __No Toxicity__\n- **Rule 2**: __Respect Admins__';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(2);

      const strongs = container.querySelectorAll('strong');
      expect(strongs.length).toBe(2);

      const underlines = container.querySelectorAll('u');
      expect(underlines.length).toBe(2);
    });
  });

  // ===========================================================================
  // SECTION 2: Remaining Discord Markdown Syntaxes (16+ Tests)
  // ===========================================================================

  describe('Standard Discord Syntaxes', () => {
    it('renders standalone bold properly (**bold**)', () => {
      const { container } = render(<DiscordMarkdown content="**Operational Status: Green**" />);

      const strongEl = container.querySelector('strong');
      expect(strongEl).toBeInTheDocument();
      expect(strongEl?.textContent).toBe('Operational Status: Green');
    });

    it('renders standalone underline properly (__underline__)', () => {
      const { container } = render(<DiscordMarkdown content="__Chief of Staff Clearance__" />);

      const uEl = container.querySelector('u');
      expect(uEl).toBeInTheDocument();
      expect(uEl?.textContent).toBe('Chief of Staff Clearance');
    });

    it('renders standalone italic with asterisk (*italic*)', () => {
      const { container } = render(<DiscordMarkdown content="*Standard Infantry*" />);

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();
      expect(emEl?.textContent).toBe('Standard Infantry');
    });

    it('renders standalone italic with underscore (_italic_)', () => {
      const { container } = render(<DiscordMarkdown content="_Standard Officer_" />);

      const emEl = container.querySelector('em');
      expect(emEl).toBeInTheDocument();
      expect(emEl?.textContent).toBe('Standard Officer');
    });

    it('renders standalone strikethrough properly (~~strikethrough~~)', () => {
      const { container } = render(<DiscordMarkdown content="~~Deprecated Channel~~" />);

      const sEl = container.querySelector('s');
      expect(sEl).toBeInTheDocument();
      expect(sEl?.textContent).toBe('Deprecated Channel');
    });

    it('renders standalone spoiler button and toggles reveal state on click', () => {
      render(<DiscordMarkdown content="||Top Secret Coordinates||" />);

      const spoilerButton = screen.getByRole('button', { name: /spoiler/i });
      expect(spoilerButton).toBeInTheDocument();
      expect(spoilerButton.getAttribute('data-revealed')).toBe('false');

      fireEvent.click(spoilerButton);
      expect(spoilerButton.getAttribute('data-revealed')).toBe('true');

      fireEvent.click(spoilerButton);
      expect(spoilerButton.getAttribute('data-revealed')).toBe('false');
    });

    it('renders custom static discord emoji with authentic CDN URL (<:name:id>)', () => {
      render(<DiscordMarkdown content="Hello <:rng_logo:123456789012345678> World" />);

      const emojiImg = screen.getByRole('img', { name: ':rng_logo:' });
      expect(emojiImg).toBeInTheDocument();
      expect(emojiImg).toHaveAttribute(
        'src',
        'https://cdn.discordapp.com/emojis/123456789012345678.webp?size=48&quality=lossless'
      );
      expect(emojiImg).toHaveAttribute('title', ':rng_logo:');
    });

    it('renders custom animated discord emoji with authentic CDN URL (<a:name:id>)', () => {
      render(<DiscordMarkdown content="Hooray <a:party_blob:987654321098765432> Done" />);

      const emojiImg = screen.getByRole('img', { name: ':party_blob:' });
      expect(emojiImg).toBeInTheDocument();
      expect(emojiImg).toHaveAttribute(
        'src',
        'https://cdn.discordapp.com/emojis/987654321098765432.gif?size=48&quality=lossless'
      );
    });

    it('renders standard link with target blank and rel noopener', () => {
      render(<DiscordMarkdown content="[Control Center](https://discord.rng.gg)" />);

      const link = screen.getByRole('link', { name: 'Control Center' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://discord.rng.gg');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders inline code block with monospace font', () => {
      const { container } = render(<DiscordMarkdown content="Execute `/verify` command" />);

      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toBe('/verify');
      expect(code?.className).toContain('font-mono');
    });

    it('renders fenced code blocks with specified language', () => {
      const markdown = '```typescript\nconst active: boolean = true;\n```';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const pre = container.querySelector('pre');
      expect(pre).toBeInTheDocument();
      const code = pre?.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code?.textContent).toContain('const active: boolean = true;');
    });

    it('renders fenced code blocks without specified language', () => {
      const markdown = '```\nplain unformatted output\n```';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const pre = container.querySelector('pre');
      expect(pre).toBeInTheDocument();
      expect(pre?.textContent).toContain('plain unformatted output');
    });

    it('renders headers: h1, h2, and h3 elements', () => {
      const markdown = '# Mission Briefing\n## Secondary Objective\n### Team Alpha';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toBe('Mission Briefing');

      const h2 = container.querySelector('h2');
      expect(h2?.textContent).toBe('Secondary Objective');

      const h3 = container.querySelector('h3');
      expect(h3?.textContent).toBe('Team Alpha');
    });

    it('renders single line blockquote with border', () => {
      const { container } = render(<DiscordMarkdown content="> This is a warning from High Command." />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.textContent).toContain('This is a warning from High Command.');
    });

    it('renders multiline blockquote syntax (>>>)', () => {
      const markdown = '>>> Paragraph 1\nParagraph 2\nParagraph 3';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeInTheDocument();
      expect(blockquote?.textContent).toContain('Paragraph 1');
      expect(blockquote?.textContent).toContain('Paragraph 2');
      expect(blockquote?.textContent).toContain('Paragraph 3');
    });

    it('renders unordered bulleted lists', () => {
      const markdown = '- Alpha\n- Bravo\n- Charlie';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const ul = container.querySelector('ul');
      expect(ul).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('Alpha');
      expect(items[1].textContent).toBe('Bravo');
      expect(items[2].textContent).toBe('Charlie');
    });

    it('renders ordered numbered lists', () => {
      const markdown = '1. First step\n2. Second step\n3. Final step';
      const { container } = render(<DiscordMarkdown content={markdown} />);

      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('First step');
      expect(items[1].textContent).toBe('Second step');
      expect(items[2].textContent).toBe('Final step');
    });

    it('renders user, role, and channel mentions cleanly', () => {
      render(
        <DiscordMarkdown content="Contact <@123456789> or <@&987654321> in <#555666777>" />
      );

      expect(screen.getByText('@123456789')).toBeInTheDocument();
      expect(screen.getByText('@987654321')).toBeInTheDocument();
      expect(screen.getByText('#555666777')).toBeInTheDocument();
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

    it('returns null when content is empty string', () => {
      const { container } = render(<DiscordMarkdown content="" />);
      expect(container.firstChild).toBeNull();
    });
  });
});
