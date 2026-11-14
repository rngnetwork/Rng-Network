import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiscordMarkdownEditor } from '../input/DiscordMarkdownEditor';

describe('DiscordMarkdownEditor', () => {
  it('renders in write mode by default with textarea and formatting toolbar', () => {
    const handleChange = vi.fn();
    render(
      <DiscordMarkdownEditor
        label="Panel Description"
        value="Initial content"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Panel Description')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /write/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Initial content');
  });

  it('switches between write and preview modes', () => {
    const handleChange = vi.fn();
    render(
      <DiscordMarkdownEditor
        label="Description"
        value="**Bold Headline** and ||[Secret](https://rng.gg)||"
        onChange={handleChange}
      />
    );

    const previewTab = screen.getByRole('tab', { name: /preview/i });
    fireEvent.click(previewTab);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Secret' })).toBeInTheDocument();

    const writeTab = screen.getByRole('tab', { name: /write/i });
    fireEvent.click(writeTab);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('normalizes escaped literal newlines into line breaks', () => {
    const handleChange = vi.fn();
    render(
      <DiscordMarkdownEditor
        label="Description"
        value={'Line 1\\nLine 2'}
        onChange={handleChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('applies markdown wrapping when toolbar button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <DiscordMarkdownEditor
        label="Description"
        value="Text to format"
        onChange={handleChange}
      />
    );

    const boldBtn = screen.getByRole('button', { name: /bold/i });
    fireEvent.click(boldBtn);

    expect(handleChange).toHaveBeenCalled();
  });
});
