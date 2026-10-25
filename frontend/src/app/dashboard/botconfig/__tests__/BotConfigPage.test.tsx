import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import BotConfigPage from '../page';
import * as botModuleApi from '@/lib/api/bot-module';
import type { NetworkDefaultPayload } from '@/lib/model/bot-module';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/bot-module', () => ({
  getNetworkDefaultModules: vi.fn(),
  patchNetworkDefaultModules: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BotConfigPage (Network-Wide Bot Deck)', () => {
  const mockNetworkPayload: NetworkDefaultPayload = {
    hubGuildId: '123456789012345678',
    servers: 5,
    schema: {
      modules: {
        automod: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable', description: 'Enable automod' },
          antiSpam: { type: 'BOOLEAN', label: 'Anti-Spam Filter', description: 'Block repetitive spam messages' },
          muteDuration: { type: 'INTEGER', label: 'Mute Duration (Seconds)', min: 10, max: 3600 },
          punishment: { type: 'STRING', label: 'Violation Punishment', options: ['delete', 'mute', 'kick', 'ban'] },
          badWords: { type: 'JSON', label: 'Banned Words Filter' },
        },
        antinuke: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          loggingChannelId: { type: 'STRING', label: 'Audit Logging Channel' },
          adminThreshold: { type: 'INTEGER', label: 'Admin Action Threshold', min: 1, max: 50 },
        },
        ticket: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          categoryId: { type: 'STRING', label: 'Ticket Channel Category' },
          supportRoleId: { type: 'STRING', label: 'Support Team Role' },
        },
        level: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          xpRate: { type: 'INTEGER', label: 'XP Multiplier', min: 1, max: 10 },
          announcementChannelId: { type: 'STRING', label: 'Level-Up Channel' },
        },
        geo: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          apiKey: { type: 'STRING', label: 'Geo API Key' },
        },
        j2c: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          hubChannelId: { type: 'STRING', label: 'J2C Hub Voice Channel' },
        },
        loa: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          minDays: { type: 'INTEGER', label: 'Minimum LOA Days' },
          maxDays: { type: 'INTEGER', label: 'Maximum LOA Days' },
        },
        strategos: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          strategyRole: { type: 'STRING', label: 'Strategos Role' },
        },
        lastMessage: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          timeoutSeconds: { type: 'INTEGER', label: 'Inactivity Timeout' },
        },
        welcome: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          welcomeChannelId: { type: 'STRING', label: 'Welcome Greetings Channel' },
        },
        farewell: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          farewellChannelId: { type: 'STRING', label: 'Farewell Channel' },
        },
        logging: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          logChannelId: { type: 'STRING', label: 'Central Log Channel' },
        },
        guild: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          guildSyncInterval: { type: 'INTEGER', label: 'Sync Interval (Seconds)' },
        },
        prefix: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          commandPrefix: { type: 'STRING', label: 'Bot Command Prefix' },
        },
      },
      networkKeys: {
        rivals_gp_log_channel: {
          type: 'STRING',
          label: 'Rivals GP Log Channel',
          description: 'Designated broadcast channel for Rivals GP events',
        },
        rt_role: {
          type: 'STRING',
          label: 'RT Role',
          uniform: true,
          description: 'Uniform network RT role requirement',
        },
        financial_ratio: {
          type: 'FLOAT',
          label: 'Financial Ratio',
          default: 1.5,
        },
        gulag_role: {
          type: 'STRING',
          label: 'Gulag Detention Role',
        },
        citizen_tier_1_role: {
          type: 'STRING',
          label: 'Citizen Tier I Role',
        },
      },
      moduleDisplayNames: {
        automod: 'Automated Moderation',
        antinuke: 'Anti-Nuke Protection',
        ticket: 'Support Tickets',
        level: 'Leveling & XP',
        geo: 'Geolocation Tracking',
        j2c: 'Join to Create (J2C)',
        loa: 'Leave of Absence (LOA)',
        strategos: 'Strategos Military AI',
        lastMessage: 'Last Message Retention',
        welcome: 'Welcome Greetings',
        farewell: 'Farewell Departures',
        logging: 'Audit Logging Engine',
        guild: 'Guild Network Sync',
        prefix: 'Command Prefix Manager',
      },
      networkKeyDisplayNames: {
        rivals_gp_log_channel: 'Rivals GP Log Channel',
        rt_role: 'RT Role',
        financial_ratio: 'Financial Ratio',
        gulag_role: 'Gulag Detention Role',
        citizen_tier_1_role: 'Citizen Tier I Role',
      },
    },
    modules: {
      automod: {
        enabled: true,
        antiSpam: true,
        muteDuration: 300,
        punishment: 'delete',
        badWords: ['spam', 'phishing'],
      },
      antinuke: {
        enabled: false,
        loggingChannelId: '111222333',
        adminThreshold: 5,
      },
      ticket: {
        enabled: true,
        categoryId: 'cat-123',
        supportRoleId: 'role-123',
      },
      level: {
        enabled: true,
        xpRate: 2,
        announcementChannelId: 'chan-123',
      },
      geo: {
        enabled: false,
        apiKey: 'geo-key-abc',
      },
      j2c: {
        enabled: true,
        hubChannelId: 'hub-123',
      },
      loa: {
        enabled: true,
        minDays: 1,
        maxDays: 30,
      },
      strategos: {
        enabled: false,
        strategyRole: 'role-strat',
      },
      lastMessage: {
        enabled: true,
        timeoutSeconds: 60,
      },
      welcome: {
        enabled: true,
        welcomeChannelId: 'welcome-123',
      },
      farewell: {
        enabled: false,
        farewellChannelId: 'farewell-123',
      },
      logging: {
        enabled: true,
        logChannelId: 'log-123',
      },
      guild: {
        enabled: true,
        guildSyncInterval: 300,
      },
      prefix: {
        enabled: true,
        commandPrefix: '!',
      },
    },
    network: {
      rivals_gp_log_channel: '987654321',
      rt_role: 'role-rt-123',
      financial_ratio: 1.5,
      gulag_role: 'role-gulag-123',
      citizen_tier_1_role: 'role-citizen-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkPayload,
    });
    vi.mocked(botModuleApi.patchNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkPayload,
    });
  });

  it('renders authentic 14 modules using backend display names and verifies zero fallback for dummy modules', async () => {
    renderWithToast(<BotConfigPage />);

    // Assert authentic modules are rendered via backend display names
    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Anti-Nuke Protection')).toBeInTheDocument();
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
    expect(screen.getByText('Leveling & XP')).toBeInTheDocument();
    expect(screen.getByText('Geolocation Tracking')).toBeInTheDocument();
    expect(screen.getByText('Join to Create (J2C)')).toBeInTheDocument();
    expect(screen.getByText('Leave of Absence (LOA)')).toBeInTheDocument();
    expect(screen.getByText('Strategos Military AI')).toBeInTheDocument();
    expect(screen.getByText('Last Message Retention')).toBeInTheDocument();
    expect(screen.getByText('Welcome Greetings')).toBeInTheDocument();
    expect(screen.getByText('Farewell Departures')).toBeInTheDocument();
    expect(screen.getByText('Audit Logging Engine')).toBeInTheDocument();
    expect(screen.getByText('Guild Network Sync')).toBeInTheDocument();
    expect(screen.getByText('Command Prefix Manager')).toBeInTheDocument();

    // Verify Zero Fallback (AP-001): Old fabricated dummy modules must NOT be rendered
    expect(screen.queryByText(/economy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/giveaway/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/music/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/starboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verification/i)).not.toBeInTheDocument();
  });

  it('filters modules by search query in real time', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Anti-Nuke Protection')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search modules and settings/i);
    expect(searchInput).toBeInTheDocument();

    // Search by nested setting name 'antiSpam'
    fireEvent.change(searchInput, { target: { value: 'antiSpam' } });
    expect(screen.getByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.queryByText('Anti-Nuke Protection')).not.toBeInTheDocument();
    expect(screen.queryByText('Support Tickets')).not.toBeInTheDocument();

    // Search by module title 'Strategos'
    fireEvent.change(searchInput, { target: { value: 'Strategos' } });
    expect(screen.getByText('Strategos Military AI')).toBeInTheDocument();
    expect(screen.queryByText('Automated Moderation')).not.toBeInTheDocument();

    // Search for non-existent query
    fireEvent.change(searchInput, { target: { value: 'nonexistent_xyz_query' } });
    expect(screen.getByText(/no modules found/i)).toBeInTheDocument();
  });

  it('expands accordion items, tracks dirty state on module modification, and submits patch payload on save', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Automod is the first module, so its accordion content is open by default.
    // Toggle antiSpam switch
    const antiSpamSwitch = screen.getByRole('switch', { name: /anti-spam filter/i });
    expect(antiSpamSwitch).toBeInTheDocument();
    fireEvent.click(antiSpamSwitch);

    // Update mute duration text input
    const muteDurationInput = screen.getByLabelText(/mute duration/i);
    expect(muteDurationInput).toBeInTheDocument();
    fireEvent.change(muteDurationInput, { target: { value: '600' } });

    // Unsaved changes notification bar should dock and show dirty count
    expect(await screen.findByText(/unsaved changes in 2 parameters/i)).toBeInTheDocument();

    // Click Save Changes button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(botModuleApi.patchNetworkDefaultModules).toHaveBeenCalledWith(
        {
          modules: {
            automod: {
              antiSpam: false,
              muteDuration: 600,
            },
          },
          network: undefined,
        },
        undefined
      );
    });
  });

  it('allows expanding other module accordions and toggling their master enable switch', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Support Tickets')).toBeInTheDocument();

    // Expand the Support Tickets accordion item
    const ticketAccordionHeader = screen.getByRole('button', { name: /support tickets/i });
    fireEvent.click(ticketAccordionHeader);

    // Master activation toggle for Support Tickets is now visible in content
    const ticketMasterToggle = await screen.findByRole('switch', {
      name: /master activation for support tickets/i,
    });
    expect(ticketMasterToggle).toBeInTheDocument();

    // Toggle master enable to false
    fireEvent.click(ticketMasterToggle);

    // Unsaved changes bar docks
    expect(await screen.findByText(/unsaved changes in 1 parameter/i)).toBeInTheDocument();

    // Click Save Changes button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(botModuleApi.patchNetworkDefaultModules).toHaveBeenCalledWith(
        {
          modules: {
            ticket: {
              enabled: false,
            },
          },
          network: undefined,
        },
        undefined
      );
    });
  });

  it('switches to Network Parameters tab and renders domain-grouped accordions and uniform keys', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Switch to Network Parameters tab
    const networkTabBtn = screen.getByRole('button', { name: /network parameters/i });
    fireEvent.click(networkTabBtn);

    // Assert domain categories are rendered
    expect(await screen.findByText('Financial & Economy Ratios')).toBeInTheDocument();
    expect(screen.getByText('Payout & Log Channels')).toBeInTheDocument();
    expect(screen.getByText('Moderation & Gulag')).toBeInTheDocument();
    expect(screen.getByText('Activity, RT & Rewards')).toBeInTheDocument();
    expect(screen.getByText('Citizen Tiers & Roles')).toBeInTheDocument();

    // Assert specific network keys and uniform badges
    expect(screen.getByText('Rivals GP Log Channel')).toBeInTheDocument();
    expect(screen.getByText('RT Role')).toBeInTheDocument();
    expect(screen.getByText('Uniform')).toBeInTheDocument();
  });

  it('discards unsaved changes when clicking Discard in the changes bar', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Modify a field to trigger dirty state
    const antiSpamSwitch = screen.getByRole('switch', { name: /anti-spam filter/i });
    fireEvent.click(antiSpamSwitch);

    // Unsaved changes bar appears
    expect(await screen.findByText(/unsaved changes in 1 parameter/i)).toBeInTheDocument();

    // Click Discard button
    const discardButton = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardButton);

    // Unsaved changes bar should disappear
    await waitFor(() => {
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  it('renders error state with retry button when loading fails', async () => {
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: false,
      message: 'Network connection refused by upstream daemon',
      data: undefined as unknown as NetworkDefaultPayload,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Unable to load modules')).toBeInTheDocument();
    expect(screen.getByText('Network connection refused by upstream daemon')).toBeInTheDocument();

    // Click Try Again button
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: true,
      data: mockNetworkPayload,
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
  });
});
