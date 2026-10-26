'use client';

import React from 'react';
import { Hash } from 'lucide-react';
import type { ChannelItem } from '@/lib/model/channel';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';

export interface DispatchChannelSelectorProps {
  channels: ChannelItem[];
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const DispatchChannelSelector: React.FC<
  DispatchChannelSelectorProps
> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  loading = false,
  disabled = false,
}) => {
  const textChannels = channels.filter(
    (ch) => ch.type === 0 || ch.type === 5
  );

  const options: DropdownOption<string>[] = (
    textChannels.length > 0 ? textChannels : channels
  ).map((ch) => ({
    label: `#${ch.name}`,
    value: ch.id,
    description: ch.parentId ? `Parent: ${ch.parentId}` : `Channel ID: ${ch.id}`,
    icon: <Hash size={14} className="text-brand-red" />,
  }));

  return (
    <Dropdown
      label="Target Destination Channel"
      options={options}
      value={selectedChannelId}
      onChange={onSelectChannel}
      placeholder={
        loading
          ? 'Synchronizing guild channels...'
          : options.length === 0
          ? 'Select a server to view channels'
          : 'Select destination text channel...'
      }
      searchable={true}
      disabled={disabled || loading || options.length === 0}
    />
  );
};
