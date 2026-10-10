'use client';

import React from 'react';
import type { ChannelItem } from '@/lib/model/channel';
import { DispatchChannelSelector } from '@/components/dashboard/embeds/DispatchTab/DispatchChannelSelector';

export interface ServerChannelPickerProps {
  channels: ChannelItem[];
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  loading?: boolean;
}

export const ServerChannelPicker: React.FC<ServerChannelPickerProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  loading = false,
}) => {
  return (
    <DispatchChannelSelector
      channels={channels}
      selectedChannelId={selectedChannelId}
      onSelectChannel={onSelectChannel}
      loading={loading}
    />
  );
};
