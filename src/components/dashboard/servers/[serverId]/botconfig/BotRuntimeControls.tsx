'use client';

import React from 'react';
import type { BotConfigData, GatewayHealthData } from '@/lib/model/server';
import { GatewayLatencyGauge } from './GatewayLatencyGauge';
import { BotPrefixSettingsForm } from './BotPrefixSettingsForm';
import { BotPermissionsAuditCard } from './BotPermissionsAuditCard';

export interface BotRuntimeControlsProps {
  config: BotConfigData;
  health: GatewayHealthData;
  onSavePrefix: (prefix: string) => Promise<void>;
}

export const BotRuntimeControls: React.FC<BotRuntimeControlsProps> = ({
  config,
  health,
  onSavePrefix,
}) => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <GatewayLatencyGauge health={health} />
      <BotPrefixSettingsForm config={config} onSavePrefix={onSavePrefix} />
      <BotPermissionsAuditCard />
    </div>
  );
};
