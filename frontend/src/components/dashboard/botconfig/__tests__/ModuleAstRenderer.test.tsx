import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ModuleAstRenderer } from '../ModuleAstRenderer';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';

describe('ModuleAstRenderer', () => {
  const schema: Record<string, BotModuleFieldSchema> = {
    enabled: { type: 'BOOLEAN', label: 'Master Enable' },
    antiSpam: { type: 'BOOLEAN', label: 'Anti-Spam Filter' },
    muteDuration: { type: 'INTEGER', label: 'Mute Duration', min: 10, max: 3600 },
    punishment: { type: 'STRING', label: 'Action', options: ['delete', 'mute', 'kick', 'ban'] },
    logChannelId: { type: 'STRING', label: 'Audit Log Channel' },
    moderatorRoleId: { type: 'STRING', label: 'Moderator Role' },
    badWords: { type: 'JSON', label: 'Banned Words List' },
  };

  const values: Record<string, unknown> = {
    enabled: true,
    antiSpam: true,
    muteDuration: 300,
    punishment: 'mute',
    logChannelId: '111111111',
    moderatorRoleId: '222222222',
    badWords: ['scam', 'spam'],
  };

  it('renders all schema fields based on AST type and naming conventions', () => {
    const handleFieldChange = vi.fn();
    render(
      <ModuleAstRenderer
        moduleName="automod"
        schema={schema}
        values={values}
        onChange={handleFieldChange}
        isNetworkDeck={false}
        serverRoles={[{ id: '222222222', name: 'Moderator' }]}
        serverChannels={[{ id: '111111111', name: 'mod-logs' }]}
      />
    );

    expect(screen.getByText('Anti-Spam Filter')).toBeInTheDocument();
    expect(screen.getByText('Mute Duration')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Audit Log Channel')).toBeInTheDocument();
    expect(screen.getByText('Moderator Role')).toBeInTheDocument();
    expect(screen.getByText('Banned Words List')).toBeInTheDocument();
    expect(screen.getByText('scam')).toBeInTheDocument();
  });

  it('disables sub-settings when enabled is false', () => {
    const handleFieldChange = vi.fn();
    render(
      <ModuleAstRenderer
        moduleName="automod"
        schema={schema}
        values={{ ...values, enabled: false }}
        onChange={handleFieldChange}
      />
    );

    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /Banned Words List/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Audit Log Channel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Moderator Role/i })).toBeDisabled();
  });
});
