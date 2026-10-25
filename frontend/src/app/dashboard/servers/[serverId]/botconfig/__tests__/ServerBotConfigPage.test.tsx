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

describe('ServerBotConfigPage (Server-Specific Accordion Deck)', () => {
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
      moduleDisplayNames: {
        automod: 'Automated Moderation',
        antinuke: 'Anti-Nuke Protection',
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
      data: [{ id: '111', name: 'general', type: 0, position: 0, parentId: null }],
    });
    vi.mocked(settingsApi.fetchServerRoles).mockResolvedValue({
      success: true,
      data: [
        {
          id: '222',
          name: 'Moderator',
          colorHex: null,
          position: 1,
          managed: false,
          assignableByBot: true,
        },
      ],
    });
  });

  it('renders inherited and overridden indicators in row-wise accordions correctly', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Anti-Nuke Protection')).toBeInTheDocument();

    expect(screen.getByText('Custom Server Override')).toBeInTheDocument();
    expect(screen.getAllByText(/network default/i).length).toBeGreaterThan(0);
  });

  it('marks inherited module for custom override when clicking Override Setting', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Anti-Nuke Protection')).toBeInTheDocument();

    // Antinuke is the first module alphabetically, so its accordion content is open by default.
    const overrideButton = await screen.findByRole('button', { name: /override setting/i });
    fireEvent.click(overrideButton);

    // After clicking override, both modules show Custom Server Override badge
    expect(screen.getAllByText('Custom Server Override').length).toBe(2);
  });

  it('calls resetServerModule API when clicking Revert to Default', async () => {
    vi.mocked(botModuleApi.resetServerModule).mockResolvedValue({
      success: true,
      data: {},
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Expand the Automod accordion item
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    const revertButton = await screen.findByRole('button', { name: /revert to default/i });
    fireEvent.click(revertButton);

    await waitFor(() => {
      expect(botModuleApi.resetServerModule).toHaveBeenCalledWith(
        'rng-testing-server',
        'automod',
        undefined
      );
    });
  });

  it('tracks dirty modifications and saves server modules with patchServerModules', async () => {
    vi.mocked(botModuleApi.patchServerModules).mockResolvedValue({
      success: true,
      data: mockServerData,
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Expand the Automod accordion item
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    // Toggle antiSpam switch
    const antiSpamSwitch = await screen.findByRole('switch', { name: /anti-spam filter/i });
    fireEvent.click(antiSpamSwitch);

    // Unsaved changes bar docks
    expect(await screen.findByText(/unsaved changes in 1 server setting/i)).toBeInTheDocument();

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(botModuleApi.patchServerModules).toHaveBeenCalledWith(
        'rng-testing-server',
        {
          automod: {
            antiSpam: false,
          },
        },
        undefined
      );
    });
  });

  it('extracts nested schema.modules, populates values from effectiveConfig, and excludes metadata keys like networkKeys and moduleDisplayNames from module list', async () => {
    const mockFullPayload = {
      serverSlug: 'rng-testing-server',
      guildId: '1526076781247987762',
      schema: {
        modules: {
          automod: {
            antiSpam: { type: 'BOOLEAN' as const, label: 'Anti-Spam Filter' },
            muteDuration: { type: 'INTEGER' as const, label: 'Mute Duration Seconds' },
          },
          antinuke: {
            antiBan: { type: 'BOOLEAN' as const, label: 'Anti-Ban Protection' },
          },
        },
        moduleDisplayNames: {
          automod: 'Automated Moderation',
          antinuke: 'Server Anti-Nuke',
        },
        networkKeys: {
          sp_ratio: { label: 'SP Ratio', default: '5' },
        },
        networkKeyDisplayNames: {
          sp_ratio: 'SP Ratio',
        },
      },
      modules: {
        automod: {
          isOverridden: true,
          effectiveConfig: {
            antiSpam: true,
            muteDuration: 300,
          },
          networkDefault: {
            antiSpam: false,
            muteDuration: 60,
          },
        },
        antinuke: {
          isOverridden: false,
          effectiveConfig: {
            antiBan: true,
          },
          networkDefault: {
            antiBan: true,
          },
        },
      },
    };

    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: mockFullPayload,
    });

    renderWithToast(<ServerBotConfigPage />);

    // Assert that the 2 authentic modules are rendered
    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Server Anti-Nuke')).toBeInTheDocument();

    // Assert that metadata keys are NEVER rendered as fake modules
    expect(screen.queryByText(/^network keys$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^network key display names$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^module display names$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^modules$/i)).not.toBeInTheDocument();

    // Expand Automod and verify sub-fields and populated values from effectiveConfig
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    expect(await screen.findByText('Anti-Spam Filter')).toBeInTheDocument();
    expect(screen.getByText('Mute Duration Seconds')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });
});
