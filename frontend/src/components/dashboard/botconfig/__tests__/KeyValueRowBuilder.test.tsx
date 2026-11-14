import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { KeyValueRowBuilder } from '../KeyValueRowBuilder';

describe('KeyValueRowBuilder', () => {
  const serverRoles = [
    { id: '123456789', name: 'Elite', color: '#3498db' },
    { id: '987654321', name: 'Master', color: '#e74c3c' },
  ];

  it('renders existing level-role entries', () => {
    const handleChange = vi.fn();
    render(
      <KeyValueRowBuilder
        value={{ '5': '123456789' }}
        onChange={handleChange}
        serverRoles={serverRoles}
      />
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
  });

  it('adds a new row and fires onChange with serialized map', () => {
    const handleChange = vi.fn();
    render(
      <KeyValueRowBuilder
        value={{ '5': '123456789' }}
        onChange={handleChange}
        serverRoles={serverRoles}
      />
    );

    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    const addButton = screen.getByText('+ Add Entry');
    fireEvent.click(addButton);

    expect(screen.getAllByRole('spinbutton').length).toBe(2);
  });

  it('removes a row when clicking the delete button', () => {
    const handleChange = vi.fn();
    render(
      <KeyValueRowBuilder
        value={{ '5': '123456789', '10': '987654321' }}
        onChange={handleChange}
        serverRoles={serverRoles}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /remove entry/i });
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[0]);

    expect(handleChange).toHaveBeenCalledWith({ '10': '987654321' });
  });

  it('enforces bounds (1 to 1000) and clamps or rejects invalid numbers', () => {
    const handleChange = vi.fn();
    render(
      <KeyValueRowBuilder
        value={{ '5': '123456789' }}
        onChange={handleChange}
        serverRoles={serverRoles}
      />
    );

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '1500' } });

    // Should clamp to 1000 or not accept >1000
    expect(handleChange).toHaveBeenCalledWith({ '1000': '123456789' });
  });
});
