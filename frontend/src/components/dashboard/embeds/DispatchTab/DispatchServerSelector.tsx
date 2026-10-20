'use client';

import React from 'react';
import { Server } from 'lucide-react';
import type { ServerItem } from '@/lib/model/server';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';

export interface DispatchServerSelectorProps {
  servers: ServerItem[];
  selectedServerId: string;
  onSelectServer: (serverId: string) => void;
  loading?: boolean;
}

export const DispatchServerSelector: React.FC<DispatchServerSelectorProps> = ({
  servers,
  selectedServerId,
  onSelectServer,
  loading = false,
}) => {
  const options: DropdownOption<string>[] = servers.map((srv) => ({
    label: srv.name,
    value: srv.id,
    description: srv.slug ? `Slug: /${srv.slug}` : `ID: ${srv.id}`,
    icon: <Server size={14} className="text-brand-red" />,
  }));

  return (
    <Dropdown
      label="Target Discord Server (Guild)"
      options={options}
      value={selectedServerId}
      onChange={onSelectServer}
      placeholder={loading ? 'Loading managed servers...' : 'Select target guild...'}
      searchable={options.length > 4}
      disabled={loading || options.length === 0}
    />
  );
};
