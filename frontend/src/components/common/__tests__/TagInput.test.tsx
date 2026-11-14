import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { TagInput } from '../input/TagInput';

describe('TagInput', () => {
  it('renders existing tags and placeholder', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam', 'scam']}
        onChange={handleChange}
        placeholder="Add forbidden word..."
        label="Bad Words Filter"
      />
    );

    expect(screen.getByText('Bad Words Filter')).toBeInTheDocument();
    expect(screen.getByText('spam')).toBeInTheDocument();
    expect(screen.getByText('scam')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add forbidden word...')).toBeInTheDocument();
  });

  it('adds a tag on Enter key', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam']}
        onChange={handleChange}
        placeholder="Add word"
      />
    );

    const input = screen.getByPlaceholderText('Add word');
    fireEvent.change(input, { target: { value: 'phishing' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['spam', 'phishing']);
  });

  it('adds a tag on comma key', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam']}
        onChange={handleChange}
        placeholder="Add word"
      />
    );

    const input = screen.getByPlaceholderText('Add word');
    fireEvent.change(input, { target: { value: 'invite,' } });
    fireEvent.keyDown(input, { key: ',', code: 'Comma' });

    expect(handleChange).toHaveBeenCalledWith(['spam', 'invite']);
  });

  it('splits and adds multiple tags when pasting comma-separated text', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam']}
        onChange={handleChange}
        placeholder="Add word"
      />
    );

    const input = screen.getByPlaceholderText('Add word');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'nsfw, raid, scam',
      },
    });

    expect(handleChange).toHaveBeenCalledWith(['spam', 'nsfw', 'raid', 'scam']);
  });

  it('does not add duplicate tags', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam']}
        onChange={handleChange}
        placeholder="Add word"
      />
    );

    const input = screen.getByPlaceholderText('Add word');
    fireEvent.change(input, { target: { value: 'spam' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('removes a tag when clicking remove button', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam', 'scam']}
        onChange={handleChange}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
    fireEvent.click(removeButtons[0]);

    expect(handleChange).toHaveBeenCalledWith(['scam']);
  });

  it('does not allow editing when disabled', () => {
    const handleChange = vi.fn();
    render(
      <TagInput
        value={['spam']}
        onChange={handleChange}
        disabled={true}
        placeholder="Disabled input"
      />
    );

    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});
