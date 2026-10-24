import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { DiscordRoleSelect } from '../input/DiscordRoleSelect';

describe('DiscordRoleSelect', () => {
  const mockRoles = [
    { id: '111111111111111111', name: 'Moderator', color: '#3498db' },
    { id: '222222222222222222', name: 'Administrator', color: '#e74c3c' },
    { id: '333333333333333333', name: 'Member', color: 0 },
  ];

  it('renders with placeholder when no role is selected', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value={null}
        onChange={handleChange}
        roles={mockRoles}
        placeholder="Select a Discord role"
      />
    );

    expect(screen.getByText('Select a Discord role')).toBeInTheDocument();
  });

  it('displays active role name when value matches an existing role', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value="111111111111111111"
        onChange={handleChange}
        roles={mockRoles}
      />
    );

    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });

  it('displays clean text fallback when role is deleted or missing from guild', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value="999999999999999999"
        onChange={handleChange}
        roles={mockRoles}
      />
    );

    expect(screen.getByText('Deleted Role (ID: 999999999999999999)')).toBeInTheDocument();
  });

  it('opens dropdown with listbox semantics and allows role selection', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value={null}
        onChange={handleChange}
        roles={mockRoles}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const option = screen.getByRole('option', { name: /Administrator/i });
    expect(option).toBeInTheDocument();
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('222222222222222222');
  });

  it('closes dropdown on Escape key', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value={null}
        onChange={handleChange}
        roles={mockRoles}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('respects disabled prop', () => {
    const handleChange = vi.fn();
    render(
      <DiscordRoleSelect
        value="111111111111111111"
        onChange={handleChange}
        roles={mockRoles}
        disabled={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
