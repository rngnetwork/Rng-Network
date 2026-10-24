import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import BotConfigPage from '../page';
import * as botModuleApi from '@/lib/api/bot-module';
import { ToastProvider } from '@/components/common/feedback/ToastProvider';

vi.mock('@/lib/api/bot-module', () => ({
  getNetworkDefaultModules: vi.fn(),
  patchNetworkDefaultModules: vi.fn(),
}));

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BotConfigPage (Network-Wide Deck)', () => {
  const mockNetworkModules = {
    automod: {
      enabled: true,
      antiSpam: true,
      muteDuration: 300,
      punishment: 'delete',
      badWords: ['scam', 'spam'],
    },
    antinuke: {
      enabled: false,
      loggingChannelId: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(botModuleApi.getNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkModules,
    });
  });

  it('renders flat grid of cards and filters by search query', async () => {
    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.getByText('Anti-Nuke Protection')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search modules and settings/i);
    expect(searchInput).toBeInTheDocument();

    // Search by nested setting name
    fireEvent.change(searchInput, { target: { value: 'antiSpam' } });
    expect(screen.getByText('Automated Moderation')).toBeInTheDocument();
    expect(screen.queryByText('Anti-Nuke Protection')).not.toBeInTheDocument();
  });

  it('shows unsaved changes bar when a field is modified and submits patch on save', async () => {
    vi.mocked(botModuleApi.patchNetworkDefaultModules).mockResolvedValue({
      success: true,
      data: mockNetworkModules,
    });

    renderWithToast(<BotConfigPage />);

    expect(await screen.findByText('Automated Moderation')).toBeInTheDocument();

    // Expand the automod card
    fireEvent.click(screen.getByText('Automated Moderation'));

    // Toggle antiSpam switch
    const antiSpamSwitch = (await screen.findAllByRole('switch'))[1];
    fireEvent.click(antiSpamSwitch);

    // Unsaved changes bar should appear
    expect(await screen.findByText(/unsaved changes/i)).toBeInTheDocument();

    // Click Save Changes button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(botModuleApi.patchNetworkDefaultModules).toHaveBeenCalledWith(
        {
          automod: {
            antiSpam: false,
          },
        },
        undefined
      );
    });
  });
});
