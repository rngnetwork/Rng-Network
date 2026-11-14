import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { DiscordChannelSelect, type DiscordChannelOption } from '../input/DiscordChannelSelect';

describe('DiscordChannelSelect', () => {
  const mockChannels: DiscordChannelOption[] = [
    { id: 'cat-comm', name: 'COMMUNITY', type: 4, position: 0 },
    { id: 'c-rules', name: 'rules', type: 0, position: 0, parentId: 'cat-comm' },
    { id: 'c-giveaway', name: 'giveaway', type: 0, position: 5, parentId: 'cat-comm' },
    { id: 'cat-voice', name: 'VOICE CHANNELS', type: 4, position: 1 },
    { id: 'c-general-vc', name: 'Lounge', type: 2, position: 0, parentId: 'cat-voice' },
    { id: 'c-welcome', name: 'welcome', type: 0, position: 0 },
  ];

  it('renders default placeholder when value is null', () => {
    const handleChange = vi.fn();
    render(
      <DiscordChannelSelect
        value={null}
        onChange={handleChange}
        channels={mockChannels}
      />
    );

    expect(screen.getByText('None (Unset)')).toBeInTheDocument();
  });

  it('displays selected channel name and allows unsetting to null', () => {
    const handleChange = vi.fn();
    render(
      <DiscordChannelSelect
        value="c-giveaway"
        onChange={handleChange}
        channels={mockChannels}
      />
    );

    expect(screen.getByText('giveaway')).toBeInTheDocument();

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const unsetOption = screen.getByRole('option', { name: /None \(Unset\)/i });
    fireEvent.click(unsetOption);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('displays fallback when channel is deleted or not found in guild', () => {
    render(
      <DiscordChannelSelect
        value="deleted-chan-id"
        onChange={vi.fn()}
        channels={mockChannels}
      />
    );

    expect(screen.getByText('Deleted Channel (ID: deleted-chan-id)')).toBeInTheDocument();
  });

  it('filters only category channels when channelTypeFilter is category', () => {
    const handleChange = vi.fn();
    render(
      <DiscordChannelSelect
        value={null}
        onChange={handleChange}
        channels={mockChannels}
        channelTypeFilter="category"
        placeholder="None (Unset Category)"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('option', { name: /COMMUNITY/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /VOICE CHANNELS/i })).toBeInTheDocument();

    expect(screen.queryByRole('option', { name: /rules/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /giveaway/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Lounge/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /welcome/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /COMMUNITY/i }));
    expect(handleChange).toHaveBeenCalledWith('cat-comm');
  });

  it('groups text channels under category headers when channelTypeFilter is text', () => {
    const handleChange = vi.fn();
    render(
      <DiscordChannelSelect
        value={null}
        onChange={handleChange}
        channels={mockChannels}
        channelTypeFilter="text"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('COMMUNITY')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^COMMUNITY$/i })).not.toBeInTheDocument();

    expect(screen.getByRole('option', { name: /rules/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /giveaway/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /welcome/i })).toBeInTheDocument();

    expect(screen.queryByRole('option', { name: /Lounge/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /giveaway/i }));
    expect(handleChange).toHaveBeenCalledWith('c-giveaway');
  });

  it('filters only voice channels when channelTypeFilter is voice', () => {
    const handleChange = vi.fn();
    render(
      <DiscordChannelSelect
        value={null}
        onChange={handleChange}
        channels={mockChannels}
        channelTypeFilter="voice"
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('option', { name: /Lounge/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /rules/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /giveaway/i })).not.toBeInTheDocument();
  });
});
