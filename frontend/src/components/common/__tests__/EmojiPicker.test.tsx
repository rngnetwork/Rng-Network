import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  EmojiPicker,
  EmojiCategory,
  getUnicodeEmojiShortcode,
} from '../input/EmojiPicker';

describe('EmojiPicker', () => {
  it('renders standard emoji categories and default tab', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Smileys' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestures' })).toBeInTheDocument();
  });

  it('selects an emoji and triggers onSelect callback', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    // Click on 😀 emoji
    const emojiBtn = screen.getByRole('button', { name: '😀' });
    fireEvent.click(emojiBtn);

    expect(onSelect).toHaveBeenCalledWith('😀');
  });

  it('switches tabs and renders active category emojis', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    const gesturesTab = screen.getByRole('button', { name: 'Gestures' });
    fireEvent.click(gesturesTab);

    expect(screen.getByRole('button', { name: '👋' })).toBeInTheDocument();
  });

  it('supports custom categories and custom image emojis', () => {
    const onSelect = vi.fn();
    const customCats: EmojiCategory[] = [
      {
        id: 'bot_emojis',
        name: 'Bot Emojis',
        emojis: [
          {
            id: 'rng_logo',
            name: 'rng_logo',
            url: 'https://cdn.example.com/logo.png',
          },
        ],
      },
    ];

    render(<EmojiPicker onSelect={onSelect} customCategories={customCats} />);

    const botTab = screen.getByRole('button', { name: 'Bot Emojis' });
    fireEvent.click(botTab);

    const customEmojiBtn = screen.getByTitle(':rng_logo:');
    expect(customEmojiBtn).toBeInTheDocument();
    fireEvent.click(customEmojiBtn);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rng_logo', name: 'rng_logo' })
    );
  });

  it('filters emojis with debounced search input', async () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    const searchInput = screen.getByPlaceholderText('Search emojis...');
    fireEvent.change(searchInput, { target: { value: 'smileys' } });

    await waitFor(
      () => {
        expect(screen.getByText('Smileys')).toBeInTheDocument();
      },
      { timeout: 300 }
    );
  });

  it('resolves correct shortcodes for objects, symbols, and variation selectors', () => {
    expect(getUnicodeEmojiShortcode('📱')).toBe('iphone');
    expect(getUnicodeEmojiShortcode('💡')).toBe('bulb');
    expect(getUnicodeEmojiShortcode('💻')).toBe('computer');
    expect(getUnicodeEmojiShortcode('❤️')).toBe('heart');
    expect(getUnicodeEmojiShortcode('🛡️')).toBe('shield');
    expect(getUnicodeEmojiShortcode('🛡')).toBe('shield');
    expect(getUnicodeEmojiShortcode('⚡')).toBe('zap');
    expect(getUnicodeEmojiShortcode('🔥')).toBe('fire');
  });
});
