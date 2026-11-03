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

  it('marks inherited module for custom override when modifying settings', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Anti-Nuke Protection')).toBeInTheDocument();

    const antinukeToggle = await screen.findByRole('switch', { name: /master enable toggle for anti-nuke protection/i });
    fireEvent.click(antinukeToggle);

    expect(screen.getAllByText('Custom Server Override').length).toBeGreaterThanOrEqual(2);
  });

  it('does not render Revert to Default button in the UI for overridden modules', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    expect(screen.queryByRole('button', { name: /revert to default/i })).not.toBeInTheDocument();
  });

  it('renders mobile badges inside the accordion section body when open', async () => {
    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    const mobileBodyBadges = document.querySelectorAll('.flex.sm\\:hidden');
    expect(mobileBodyBadges.length).toBeGreaterThan(0);
    const combinedText = Array.from(mobileBodyBadges).map((el) => el.textContent).join(' ');
    expect(combinedText).toContain('Custom Server Override');
    expect(combinedText).toContain('Active');
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

  it('renders DiscordChannelSelect and DiscordRoleSelect for channel and role fields', async () => {
    const mockDataWithRoleChannel = {
      ...mockServerData,
      schema: {
        ...mockServerData.schema,
        automod: {
          ...mockServerData.schema.automod,
          logChannel: { type: 'STRING' as const, label: 'Mod Log Channel' },
          alertRole: { type: 'STRING' as const, label: 'Alert Ping Role' },
        },
      },
      modules: {
        ...mockServerData.modules,
        automod: {
          ...mockServerData.modules.automod,
          values: {
            ...mockServerData.modules.automod.values,
            logChannel: '111',
            alertRole: '222',
          },
        },
      },
    };

    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: mockDataWithRoleChannel,
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    expect(await screen.findByText('Mod Log Channel')).toBeInTheDocument();
    expect(screen.getByText('Alert Ping Role')).toBeInTheDocument();

    const channelSelectBtn = screen.getByRole('button', { name: /mod log channel/i });
    expect(channelSelectBtn).toBeInTheDocument();
    expect(channelSelectBtn).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByText('general')).toBeInTheDocument();

    const roleSelectBtn = screen.getByRole('button', { name: /alert ping role/i });
    expect(roleSelectBtn).toBeInTheDocument();
    expect(roleSelectBtn).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });

  it('renders TagInput for array fields, Slider for bounded numbers, and SegmentedControl for small option lists', async () => {
    const mockDataWithSpecializedInputs = {
      ...mockServerData,
      schema: {
        ...mockServerData.schema,
        automod: {
          ...mockServerData.schema.automod,
          badWords: { type: 'ARRAY' as const, label: 'Banned Words' },
          punishment: { type: 'STRING' as const, label: 'Punishment Mode', options: ['delete', 'mute', 'kick', 'ban'] },
          sensitivity: { type: 'INTEGER' as const, label: 'Detection Sensitivity', min: 1, max: 10 },
        },
      },
      modules: {
        ...mockServerData.modules,
        automod: {
          ...mockServerData.modules.automod,
          values: {
            ...mockServerData.modules.automod.values,
            badWords: ['badword1', 'badword2'],
            punishment: 'mute',
            sensitivity: 7,
          },
        },
      },
    };

    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: mockDataWithSpecializedInputs,
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    const automodHeader = screen.getByRole('button', { name: /automated moderation/i });
    fireEvent.click(automodHeader);

    expect(await screen.findByText('Banned Words')).toBeInTheDocument();
    expect(screen.getByText('badword1')).toBeInTheDocument();
    expect(screen.getByText('badword2')).toBeInTheDocument();

    expect(screen.getByText('Detection Sensitivity')).toBeInTheDocument();
    const sliderInput = screen.getByRole('slider', { name: /detection sensitivity/i });
    expect(sliderInput).toBeInTheDocument();
    expect(sliderInput).toHaveAttribute('min', '1');
    expect(sliderInput).toHaveAttribute('max', '10');
    expect(sliderInput).toHaveAttribute('aria-valuenow', '7');

    expect(screen.getByText('Punishment Mode')).toBeInTheDocument();
    const radioGroup = screen.getByRole('radiogroup', { name: /punishment mode/i });
    expect(radioGroup).toBeInTheDocument();
    const muteOption = screen.getByRole('radio', { name: 'mute' });
    expect(muteOption).toBeInTheDocument();
    expect(muteOption).toHaveAttribute('aria-checked', 'true');
  });

  it('renders DiscordMarkdownEditor for description fields with write and preview tabs', async () => {
    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: {
        serverSlug: 'rng-testing-server',
        guildId: '1526076781247987762',
        schema: {
          ticket: {
            enabled: { type: 'BOOLEAN' as const, label: 'Master Enable' },
            panelDescription: { type: 'STRING' as const, label: 'Panel Description' },
          },
          moduleDisplayNames: {
            ticket: 'Ticket Support',
          },
        },
        modules: {
          ticket: {
            isOverridden: true,
            values: {
              enabled: true,
              panelDescription: '> Need help?\\n> Open a ticket',
            },
            networkDefault: {
              enabled: true,
              panelDescription: '> Need help?\\n> Open a ticket',
            },
          },
        },
      },
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Ticket Support')).toBeInTheDocument();

    const ticketHeader = screen.getByRole('button', { name: /ticket support/i });
    if (ticketHeader.getAttribute('aria-expanded') !== 'true') {
      fireEvent.click(ticketHeader);
    }

    expect(await screen.findByText('Panel Description')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /write/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();

    const textarea = document.querySelector('textarea');
    expect(textarea).toHaveValue('> Need help?\n> Open a ticket');
  });

  it('correctly evaluates null server module as disabled without setting active toggle ON (BUG-012)', async () => {
    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: {
        serverSlug: 'rng-testing-server',
        guildId: '1526076781247987762',
        schema: {
          vanityRoles: {
            enabled: { type: 'BOOLEAN' as const, label: 'Master Enable', default: false },
            roleId: { type: 'STRING' as const, label: 'Vanity Role' },
          },
          moduleDisplayNames: {
            vanityRoles: 'Vanity Roles',
          },
        },
        modules: {
          vanityRoles: {
            isOverridden: false,
            values: null as any,
            effectiveConfig: null as any,
            networkDefault: null as any,
          },
        },
      },
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Vanity Roles')).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: /master enable toggle for vanity roles/i });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Module Disabled')).toBeInTheDocument();
  });

  it('disables master toggle when module enabled is readOnly and disables readOnly fields (BUG-013)', async () => {
    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: {
        serverSlug: 'rng-testing-server',
        guildId: '1526076781247987762',
        schema: {
          jobs: {
            enabled: { type: 'BOOLEAN' as const, label: 'Master Enable', readOnly: true },
            effectiveDate: { type: 'STRING' as const, label: 'Effective Date', readOnly: true },
            rolesEnforce: { type: 'BOOLEAN' as const, label: 'Enforce Roles' },
          },
          moduleDisplayNames: {
            jobs: 'Staff Jobs & Clearance',
          },
        },
        modules: {
          jobs: {
            isOverridden: true,
            values: {
              enabled: false,
              effectiveDate: '2026-08-01',
              rolesEnforce: false,
            },
          },
        },
      },
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Staff Jobs & Clearance')).toBeInTheDocument();
    const jobsHeader = screen.getByRole('button', { name: /staff jobs & clearance/i });
    if (jobsHeader.getAttribute('aria-expanded') !== 'true') {
      fireEvent.click(jobsHeader);
    }

    const masterToggle = screen.getByRole('switch', { name: /master enable toggle for staff jobs & clearance/i });
    expect(masterToggle).toBeDisabled();

    const effectiveDateInput = screen.getByRole('textbox', { name: /effective date/i });
    expect(effectiveDateInput).toBeDisabled();
  });

  it('renders structured RoleMappingsEditor for ARRAY<OBJECT> roleMappings field with readOnly support (BUG-014)', async () => {
    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: {
        serverSlug: 'rng-testing-server',
        guildId: '1526076781247987762',
        schema: {
          jobs: {
            enabled: { type: 'BOOLEAN' as const, label: 'Master Enable' },
            roleMappings: {
              type: 'ARRAY<OBJECT>' as any,
              label: 'Role Mappings',
              readOnly: true,
              items: {
                roleKey: { type: 'STRING', nullable: false },
                roleId: { type: 'STRING', nullable: false },
                kind: { type: 'STRING', enum: ['ministry', 'position', 'rank'] },
              },
            },
          },
          moduleDisplayNames: {
            jobs: 'Staff Jobs & Clearance',
          },
        },
        modules: {
          jobs: {
            isOverridden: true,
            values: {
              enabled: true,
              roleMappings: [
                {
                  roleKey: 'high_command',
                  roleId: '222',
                  kind: 'rank',
                  ministry: 'Supreme',
                  position: 'Chief',
                  rank: 1,
                },
              ],
            },
          },
        },
      },
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Staff Jobs & Clearance')).toBeInTheDocument();
    const jobsHeader = screen.getByRole('button', { name: /staff jobs & clearance/i });
    if (jobsHeader.getAttribute('aria-expanded') !== 'true') {
      fireEvent.click(jobsHeader);
    }

    expect(await screen.findByText('Role Mappings')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type: ARRAY/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('high_command')).toBeInTheDocument();
    expect(screen.getByText('Moderator')).toBeInTheDocument();
  });

  it('renders CheckMarkField for ACTION type fields and executes action without dirtying form', async () => {
    const mockDataWithAction = {
      ...mockServerData,
      schema: {
        ...mockServerData.schema,
        ticket: {
          enabled: { type: 'BOOLEAN' as const, label: 'Ticket System' },
          sendPanel: {
            type: 'ACTION' as const,
            action: true,
            label: 'Send Panel',
            default: false,
            nullable: true,
            description: 'send true to post / re-post the panel in the panel channel (not stored)',
          },
        },
      },
      modules: {
        ...mockServerData.modules,
        ticket: {
          isOverridden: true,
          values: {
            enabled: true,
            sendPanel: false,
          },
        },
      },
    };

    vi.mocked(botModuleApi.getServerEffectiveModules).mockResolvedValueOnce({
      success: true,
      data: mockDataWithAction,
    });
    vi.mocked(botModuleApi.patchServerModules).mockResolvedValueOnce({
      success: true,
      data: mockDataWithAction,
    });

    renderWithToast(<ServerBotConfigPage />);

    expect(await screen.findByText('Ticket')).toBeInTheDocument();
    const ticketHeader = screen.getByRole('button', { name: /ticket/i });
    if (ticketHeader.getAttribute('aria-expanded') !== 'true') {
      fireEvent.click(ticketHeader);
    }

    expect(await screen.findByText('Send Panel')).toBeInTheDocument();
    expect(screen.getByText('send true to post / re-post the panel in the panel channel (not stored)')).toBeInTheDocument();

    const executeBtn = screen.getByRole('button', { name: 'Send Panel - execute' });
    const cancelBtn = screen.getByRole('button', { name: 'Send Panel - cancel' });
    expect(executeBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(botModuleApi.patchServerModules).toHaveBeenCalledWith(
        'rng-testing-server',
        { ticket: { sendPanel: true } },
        undefined
      );
    });

    expect(screen.queryByText(/You have unsaved changes/i)).not.toBeInTheDocument();
  });
});
