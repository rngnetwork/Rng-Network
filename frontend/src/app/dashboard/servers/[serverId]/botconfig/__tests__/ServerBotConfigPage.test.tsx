import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ServerBotConfigPage from '../page';
import * as botModuleApi from '@/lib/api/bot-module';
import * as settingsApi from '@/lib/api/dashboard/servers/[serverId]/settings';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('next/navigation', () => ({
  useParams: () => ({ serverId: 'rng-testing-server' }),
  usePathname: () => '/dashboard/servers/rng-testing-server/botconfig',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/api/bot-module', () => ({
  getServerEffectiveModules: vi.fn(),
  patchServerModules: vi.fn(),
  resetServerModule: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/servers/[serverId]/settings', () => ({
  fetchServerChannels: vi.fn(),
  fetchServerRoles: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('ServerBotConfigPage (Server-Specific Deck)', () => {
  const mockServerData = {
    serverSlug: 'rng-testing-server',
    guildId: '1526076781247987762',
    schema: {
      automod: {
        enabled: { type: 'BOOLEAN' as const, label: 'Master Enable' },
        antiSpam: { type: 'BOOLEAN' as const, label: 'Anti-Spam Filter' },
      },
      antinuke: {
        enabled: { type: 'BOOLEAN' as const, label: 'Master Enable' },
      },
    },
    modules: {
      automod: {
        isOverridden: true,
        values: {
          enabled: true,
          antiSpam: true,
        },
        networkDefault: {
          enabled: true,
          antiSpam: false,
        },
      },
      antinuke: {
        isOverridden: false,
        values: {
          enabled: false,
        },
        networkDefault: {
          enabled: false,
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValue({
      success: true,
      data: mockServerData,
    });
    vi.mocked(settingsApi.fetchServerChannels).mockResolvedValue({
      success: true,
      data: [{ id: '111', name: 'general', type: 0, position: 0 }],
    });
    vi.mocked(settingsApi.fetchServerRoles).mockResolvedValue({
      success: true,
      data: [{ id: '222', name: 'Moderator', color: 0, position: 1 }],
    });
  });

  it('renders inherited and overridden indicators correctly', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Anti-Nuke Protection')).toBeInTheDocument();

    expect(screen.getByText('Server Override')).toBeInTheDocument();
    expect(screen.getByText('Network Default')).toBeInTheDocument();
    expect(screen.getByText('Override Module')).toBeInTheDocument();
  });

  it('unlocks inherited module when clicking Override Module', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Anti-Nuke Protection')).toBeInTheDocument();
    const overrideButton = screen.getByText('Override Module');
    fireEvent.click(overrideButton);

    // After clicking override, the module state is marked overridden
    expect(screen.getAllByText('Server Override').length).toBe(2);
  });

  it('opens revert confirmation modal and calls reset API on confirm', async () => {
    vi.mocked(botModuleApi.resetServerModule).mockResolvedValue({
      success: true,
      data: {},
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const revertButton = screen.getByTitle(/revert to network default/i);
    fireEvent.click(revertButton);

    expect(await screen.findByText(/revert module to default/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm revert/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(botModuleApi.resetServerModule).toHaveBeenCalledWith(
        'rng-testing-server',
        'automod',
        undefined
      );
    });
  });
});
