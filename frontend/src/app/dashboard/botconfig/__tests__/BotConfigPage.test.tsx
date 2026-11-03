'use client';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import BotConfigPage from '../page';
import * as botModuleApi from '@/lib/api/bot-module';
import * as serverApi from '@/lib/api/dashboard/servers';
import type { NetworkDefaultPayload } from '@/lib/model/bot-module';
import type { ServerItem } from '@/lib/model/server';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/bot-module', () => ({
  getNetworkDefaultModules: vi.fn(),
  patchNetworkDefaultModules: vi.fn(),
}));

vi.mock('@/lib/api/dashboard/servers', () => ({
  fetchUserManagedServers: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BotConfigPage (Network-Wide Bot Deck)', () => {
  const mockNetworkPayload: NetworkDefaultPayload = {
    servers: 13,
    schema: {
      modules: {
        automod: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          antiSpam: { type: 'BOOLEAN', label: 'Anti-Spam Filter' },
          muteDuration: { type: 'INTEGER', label: 'Mute Duration (Seconds)' },
          punishment: { type: 'STRING', label: 'Violation Action', options: ['delete', 'mute', 'kick', 'ban'] },
          badWords: { type: 'JSON', label: 'Prohibited Phrases List' },
        },
        antinuke: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          loggingChannelId: { type: 'STRING', label: 'Audit Logging Channel' },
          adminThreshold: { type: 'INTEGER', label: 'Admin Action Threshold' },
        },
        ticket: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          categoryId: { type: 'STRING', label: 'Ticket Category' },
          supportRoleId: { type: 'STRING', label: 'Support Team Role' },
        },
        level: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          xpRate: { type: 'INTEGER', label: 'XP Multiplier' },
          announcementChannelId: { type: 'STRING', label: 'Level-Up Channel' },
        },
        geo: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          apiKey: { type: 'STRING', label: 'Geocoding API Key' },
        },
        ai: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          provider: { type: 'STRING', label: 'Model Provider' },
        },
        strategos: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          militaryAiModel: { type: 'STRING', label: 'Military AI Model' },
        },
        lastMessage: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          retentionHours: { type: 'INTEGER', label: 'Retention Hours' },
        },
        welcome: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          welcomeChannelId: { type: 'STRING', label: 'Welcome Channel' },
        },
        farewell: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          farewellChannelId: { type: 'STRING', label: 'Farewell Channel' },
        },
        duty: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          dutyLogChannelId: { type: 'STRING', label: 'Duty Logs Channel' },
        },
        guild: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          syncInterval: { type: 'INTEGER', label: 'Sync Interval (Seconds)' },
        },
        prefix: {
          enabled: { type: 'BOOLEAN', label: 'Master Enable' },
          commandPrefix: { type: 'STRING', label: 'Command Prefix' },
        },
      },
      networkKeys: {
        rivals_gp_log_channel: {
          type: 'STRING',
          label: 'Rivals GP Log Channel',
          description: 'Designated Discord channel for Rivals GP broadcast events',
        },
        rt_role: {
          type: 'STRING',
          label: 'RT Role',
          uniform: true,
          description: 'Global RT clearance authority role',
        },
        financial_ratio: {
          type: 'FLOAT',
          label: 'Financial Ratio',
          description: 'Economic transaction multiplier',
        },
      },
      moduleDisplayNames: {
        automod: 'Automated Moderation',
        antinuke: 'Server Anti-Nuke',
        ticket: 'Support Tickets System',
        level: 'Member Leveling System',
        geo: 'Geolocation Verification',
        ai: 'Autonomous Intelligence Engine',
        strategos: 'Strategos AI Orchestrator',
        lastMessage: 'Last Activity Telemetry',
        welcome: 'Welcome Greetings Module',
        farewell: 'Farewell Parting Module',
        duty: 'Personnel Duty Dispatcher',
        guild: 'Guild Synchronization Engine',
        prefix: 'Bot Command Prefix Gateway',
      },
      networkKeyDisplayNames: {
        rivals_gp_log_channel: 'Rivals GP Log Channel',
        rt_role: 'RT Role',
        financial_ratio: 'Financial Ratio',
      },
    },
    modules: {
      automod: {
        enabled: true,
        antiSpam: true,
        muteDuration: 300,
        punishment: 'delete',
        badWords: ['spam', 'bad'],
      },
      antinuke: {
        enabled: false,
        loggingChannelId: null,
        adminThreshold: 3,
      },
      ticket: {
        enabled: true,
        categoryId: 'cat-123',
        supportRoleId: 'role-supp-1',
      },
      level: {
        enabled: true,
        xpRate: 2,
        announcementChannelId: null,
      },
      geo: {
        enabled: false,
        apiKey: 'masked-key',
      },
      ai: {
        enabled: true,
        provider: 'openai',
      },
      strategos: {
        enabled: true,
        militaryAiModel: 'gpt-4o',
      },
      lastMessage: {
        enabled: true,
        retentionHours: 24,
      },
      welcome: {
        enabled: true,
        welcomeChannelId: 'chan-welc',
      },
      farewell: {
        enabled: false,
        farewellChannelId: null,
      },
      duty: {
        enabled: true,
        dutyLogChannelId: 'chan-duty',
      },
      guild: {
        enabled: true,
        syncInterval: 30,
      },
      prefix: {
        enabled: true,
        commandPrefix: '!',
      },
    },
    network: {
      rivals_gp_log_channel: {
        label: 'Rivals GP Log Channel',
        default: '123456789012345678',
        value: '123456789012345678',
        uniform: false,
        servers: 1,
        valuesByGuild: {
          '1440609860537290849': '987654321098765432',
        },
      },
      rt_role: {
        label: 'RT Role',
        default: 'role-rt-default',
        value: 'role-rt-default',
        uniform: true,
        servers: 0,
        valuesByGuild: {},
      },
      financial_ratio: {
        label: 'Financial Ratio',
        default: 1.5,
        value: 1.5,
        uniform: false,
        servers: 0,
        valuesByGuild: {},
      },
    },
  };

  const mockServers: ServerItem[] = [
    {
      id: '1440609860537290849',
      name: 'RNG - Roughnuts',
      slug: 'roughnuts',
      iconUrl: 'https://cdn.discordapp.com/icons/1440609860537290849/icon.png',
      bannerUrl: null,
      onlineCount: 42,
      totalCount: 150,
      boostLevel: 2,
      boostCount: 7,
      status: 'ACTIVE',
    },
    {
      id: '1526076781247987762',
      name: 'RNG - Rivals',
      slug: 'rivals',
      iconUrl: null,
      bannerUrl: null,
      onlineCount: 15,
      totalCount: 80,
      boostLevel: 0,
      boostCount: 0,
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkPayload,
    });
    vi.mocked(serverApi.fetchUserManagedServers).mockResolvedValue({
      success: true,
      data: mockServers,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders authentic 14 modules using backend display names and verifies zero fallback for dummy modules', async () => {
    renderWithToast(<BotConfigPage />);

    // Assert that backend display names are rendered
    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Server Anti-Nuke')).toBeInTheDocument();
    expect(screen.getByText('Support Tickets System')).toBeInTheDocument();
    expect(screen.getByText('Member Leveling System')).toBeInTheDocument();
    expect(screen.getByText('Geolocation Verification')).toBeInTheDocument();
    expect(screen.getByText('Autonomous Intelligence Engine')).toBeInTheDocument();
    expect(screen.getByText('Strategos AI Orchestrator')).toBeInTheDocument();
    expect(screen.getByText('Last Activity Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Welcome Greetings Module')).toBeInTheDocument();
    expect(screen.getByText('Farewell Parting Module')).toBeInTheDocument();
    expect(screen.getByText('Personnel Duty Dispatcher')).toBeInTheDocument();
    expect(screen.getByText('Guild Synchronization Engine')).toBeInTheDocument();
    expect(screen.getByText('Bot Command Prefix Gateway')).toBeInTheDocument();

    // Verify zero dummy modules from previous fallback implementation (AP-001)
    expect(screen.queryByText(/economy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reactionrole/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/music/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/starboard/i)).not.toBeInTheDocument();
  });

  it('filters modules by search query in real time', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search modules and settings/i);
    fireEvent.change(searchInput, { target: { value: 'ticket' } });

    // Ticket module should be present
    expect(screen.getByText('Support Tickets System')).toBeInTheDocument();

    // Unrelated modules should be filtered out
    expect(screen.queryByText('Automated Moderation')).not.toBeInTheDocument();
    expect(screen.queryByText('Server Anti-Nuke')).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } });
  });

  it('expands accordion items, tracks dirty state on module modification, and submits patch payload on save', async () => {
    vi.mocked(botModuleApi.patchNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkPayload,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Expand the Automod accordion item
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    // Toggle antiSpam switch
    const antiSpamSwitch = await screen.findByRole('switch', { name: /anti-spam filter/i });
    fireEvent.click(antiSpamSwitch);

    // Change mute duration
    const muteDurationInput = screen.getByDisplayValue('300');
    fireEvent.change(muteDurationInput, { target: { value: '600' } });

    // Unsaved changes bar should appear
    expect(await screen.findByText(/unsaved configuration change/i)).toBeInTheDocument();

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

  it('switches to Network Parameters tab, renders proper form fields, and displays Values By Guild custom component', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Switch to Network Parameters tab
    const networkTabBtn = screen.getByRole('button', { name: /network parameters/i });
    fireEvent.click(networkTabBtn);

    // Assert specific network keys are rendered
    expect((await screen.findAllByText('Rivals GP Log Channel')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('RT Role').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Financial Ratio').length).toBeGreaterThan(0);

    // Assert formatted field labels
    expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Default').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Uniform').length).toBeGreaterThan(0);

    // Assert Values By Guild custom component is present
    expect(screen.getAllByText('Values By Guild').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /add server override/i }).length).toBeGreaterThan(0);

    // Assert server name and ID is displayed in the Values By Guild override
    expect(screen.getByText(/1440609860537290849/i)).toBeInTheDocument();
  });

  it('discards unsaved changes when clicking Discard in the changes bar', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Expand the Automod accordion item
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    // Modify a field to trigger dirty state
    const antiSpamSwitch = await screen.findByRole('switch', { name: /anti-spam filter/i });
    fireEvent.click(antiSpamSwitch);

    // Unsaved changes bar appears
    expect(await screen.findByText(/unsaved configuration change/i)).toBeInTheDocument();

    // Click Discard button
    const discardButton = screen.getByRole('button', { name: /discard/i });
    fireEvent.click(discardButton);

    // Unsaved changes bar should disappear
    await waitFor(() => {
      expect(screen.queryByText(/unsaved configuration change/i)).not.toBeInTheDocument();
    });
  });

  it('renders error state with retry button when loading fails', async () => {
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: false,
      message: 'Network service timeout',
      data: null as unknown as NetworkDefaultPayload,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText(/failed to load network bot modules/i)).toBeInTheDocument();
    expect(screen.getByText('Network service timeout')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry connection/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: true,
      data: mockNetworkPayload,
    });

    fireEvent.click(retryBtn);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
  });

  it('renders only Bot Modules and Network Parameters tabs and excludes synthetic display name subtabs', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /bot modules/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /network parameters/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /module display names/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /network keys display names/i })).not.toBeInTheDocument();
  });

  it('renders full-width search bar and renders untruncated description inside accordion body', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search modules and settings/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.className).toContain('w-full');

    const networkTabBtn = screen.getByRole('button', { name: /network parameters/i });
    fireEvent.click(networkTabBtn);

    expect(await screen.findByText('Designated Discord channel for Rivals GP broadcast events')).toBeInTheDocument();
  });

  it('collapses all accordion items when clicking Collapse All', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Find Collapse All button
    const collapseAllBtn = screen.getByRole('button', { name: /collapse all/i });
    expect(collapseAllBtn).toBeInTheDocument();

    fireEvent.click(collapseAllBtn);

    expect(screen.getByText(/0 of \d+ expanded/i)).toBeInTheDocument();
  });

  it('renders SegmentedControl, Slider, and TagInput for corresponding network module field types', async () => {
    const payloadWithSpecializedInputs: NetworkDefaultPayload = {
      ...mockNetworkPayload,
      schema: {
        ...mockNetworkPayload.schema,
        modules: {
          ...mockNetworkPayload.schema?.modules,
          automod: {
            enabled: { type: 'BOOLEAN', label: 'Master Enable' },
            punishment: { type: 'STRING', label: 'Violation Action', options: ['delete', 'mute', 'kick', 'ban'] },
            sensitivity: { type: 'INTEGER', label: 'Sensitivity Level', min: 1, max: 10 },
            bannedWords: { type: 'ARRAY', label: 'Banned Words List' },
          },
        },
      },
      modules: {
        ...mockNetworkPayload.modules,
        automod: {
          enabled: true,
          punishment: 'delete',
          sensitivity: 5,
          bannedWords: ['netbad1', 'netbad2'],
        },
      },
    };

    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: true,
      data: payloadWithSpecializedInputs,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const automodAccordion = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodAccordion);

    expect(await screen.findByText('Violation Action')).toBeInTheDocument();
    const radioGroup = screen.getByRole('radiogroup', { name: /violation action/i });
    expect(radioGroup).toBeInTheDocument();
    const deleteOption = screen.getByRole('radio', { name: 'delete' });
    expect(deleteOption).toBeInTheDocument();
    expect(deleteOption).toHaveAttribute('aria-checked', 'true');

    expect(screen.getByText('Sensitivity Level')).toBeInTheDocument();
    const sliderInput = screen.getByRole('slider', { name: /sensitivity level/i });
    expect(sliderInput).toBeInTheDocument();
    expect(sliderInput).toHaveAttribute('min', '1');
    expect(sliderInput).toHaveAttribute('max', '10');
    expect(sliderInput).toHaveAttribute('aria-valuenow', '5');

    expect(screen.getByText('Banned Words List')).toBeInTheDocument();
    expect(screen.getByText('netbad1')).toBeInTheDocument();
    expect(screen.getByText('netbad2')).toBeInTheDocument();
  });

  it('renders CheckMarkField for ACTION type fields in network-wide bot config and executes action', async () => {
    const payloadWithAction: NetworkDefaultPayload = {
      ...mockNetworkPayload,
      schema: {
        ...mockNetworkPayload.schema,
        modules: {
          ...mockNetworkPayload.schema?.modules,
          ticket: {
            enabled: { type: 'BOOLEAN', label: 'Ticket System' },
            sendPanel: {
              type: 'ACTION',
              action: true,
              label: 'Send Panel',
              default: false,
              nullable: true,
              description: 'send true to post / re-post the panel in the panel channel (not stored)',
            },
          },
        },
      },
      modules: {
        ...mockNetworkPayload.modules,
        ticket: {
          enabled: true,
          sendPanel: false,
        },
      },
    };

    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValueOnce({
      success: true,
      data: payloadWithAction,
    });
    vi.mocked(botModuleApi.patchNetworkDefaultModules).mockResolvedValueOnce({
      success: true,
      data: payloadWithAction,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Support Tickets System')).toBeInTheDocument();
    const ticketAccordion = screen.getByRole('button', { name: /support tickets system/i });
    fireEvent.click(ticketAccordion);

    expect(await screen.findByText('Send Panel')).toBeInTheDocument();
    expect(screen.getByText('send true to post / re-post the panel in the panel channel (not stored)')).toBeInTheDocument();

    const executeBtn = screen.getByRole('button', { name: 'Send Panel - execute' });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(botModuleApi.patchNetworkDefaultModules).toHaveBeenCalledWith(
        { modules: { ticket: { sendPanel: true } } },
        undefined
      );
    });
  });
});
