'use client';

import React, { useState } from 'react';
import { Terminal, Check } from 'lucide-react';
import type { BotConfigData } from '@/lib/model/server';
import { Card } from '@/components/common/containers/Card';
import { TextInput } from '@/components/common/input/TextInput';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface BotPrefixSettingsFormProps {
  config: BotConfigData;
  onSavePrefix: (prefix: string) => Promise<void>;
}

export const BotPrefixSettingsForm: React.FC<BotPrefixSettingsFormProps> = ({
  config,
  onSavePrefix,
}) => {
  const [prefix, setPrefix] = useState(config.commandPrefix);
  const [ephemeralDefault, setEphemeralDefault] = useState(config.ephemeralRepliesDefault);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSavePrefix(prefix);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      title="Bot Runtime & Command Configuration"
      subtitle="Configure interaction SLA defaults and sliding-window rate limits"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
        <div className="max-w-sm">
          <TextInput
            label="Command Prefix"
            value={prefix}
            maxLength={5}
            onChange={(e) => setPrefix(e.target.value)}
            leftIcon={<Terminal size={15} />}
            helperText="Prefix for legacy text fallback commands (1–5 characters)."
          />
        </div>

        <div className="p-4 rounded-apple-md bg-white/[0.02] border border-white/[0.06]">
          <ToggleSwitch
            checked={ephemeralDefault}
            onChange={setEphemeralDefault}
            label="Default Ephemeral Interaction Acknowledgments"
            description="Deliver <50ms deferReply(true) ephemeral acknowledgments on rng_act_* triggers."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Check size={14} />}
          >
            Save Bot Configuration
          </Button>
        </div>
      </form>
    </Card>
  );
};
