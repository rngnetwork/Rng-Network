import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { SegmentedControl } from '../input/SegmentedControl';

describe('SegmentedControl', () => {
  const options = [
    { label: 'Delete', value: 'delete' },
    { label: 'Mute', value: 'mute' },
    { label: 'Kick', value: 'kick' },
    { label: 'Ban', value: 'ban', disabled: true },
  ];

  it('renders all options and active state', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="delete"
        onChange={handleChange}
        label="Punishment Action"
      />
    );

    expect(screen.getByText('Punishment Action')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Mute')).toBeInTheDocument();
    expect(screen.getByText('Kick')).toBeInTheDocument();
    expect(screen.getByText('Ban')).toBeInTheDocument();
  });

  it('calls onChange when clicking an enabled option', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="delete"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText('Mute'));
    expect(handleChange).toHaveBeenCalledWith('mute');
  });

  it('does not call onChange when clicking a disabled option', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="delete"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText('Ban'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when the entire control is disabled', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="delete"
        onChange={handleChange}
        disabled={true}
      />
    );

    fireEvent.click(screen.getByText('Mute'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
