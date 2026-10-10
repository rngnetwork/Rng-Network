'use client';

import React, { useEffect, useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import type { ClientValidationReport } from '@/lib/model/embed';
import type { ServerItem } from '@/lib/model/server';
import type { ChannelItem } from '@/lib/model/channel';
import type { DryRunValidationReportData } from '@/lib/model/dispatch';
import { fetchRegisteredServers } from '@/lib/api/dashboard/servers';
import {
  fetchDispatchChannels,
  dispatchEmbed,
  scheduleEmbedDispatch,
  validatePreflight,
} from '@/lib/api/dashboard/embeds';
import { Button } from '@/components/common/input/Button';
import { Alert } from '@/components/common/feedback/Alert';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { DispatchServerSelector } from './DispatchServerSelector';
import { DispatchChannelSelector } from './DispatchChannelSelector';
import { DispatchScheduleSettings } from './DispatchScheduleSettings';
import { PreflightLintStatusCard } from './PreflightLintStatusCard';

export interface GlobalDispatchCoordinatorProps {
  validationReport: ClientValidationReport;
  fixedServerId?: string;
}

export const GlobalDispatchCoordinator: React.FC<
  GlobalDispatchCoordinatorProps
> = ({ validationReport, fixedServerId }) => {
  const { toast } = useToast();
  const [prevFixedServerId, setPrevFixedServerId] = useState(fixedServerId);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>(
    fixedServerId || ''
  );
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined
  );
  const [loadingServers, setLoadingServers] = useState(!fixedServerId);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [testingDryRun, setTestingDryRun] = useState(false);
  const [serverReport, setServerReport] =
    useState<DryRunValidationReportData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (fixedServerId !== prevFixedServerId) {
    setPrevFixedServerId(fixedServerId);
    if (fixedServerId) {
      setSelectedServerId(fixedServerId);
      setLoadingServers(false);
    }
  }

  useEffect(() => {
    if (fixedServerId) {
      return undefined;
    }

    let isMounted = true;
    const loadServers = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;
      try {
        const res = await fetchRegisteredServers(token);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setServers(res.data);
          if (res.data.length > 0 && !selectedServerId) {
            setSelectedServerId(res.data[0].id);
          }
        }
      } catch {
        // Handled by empty dropdown state
      } finally {
        if (isMounted) setLoadingServers(false);
      }
    };

    void loadServers();
    return () => {
      isMounted = false;
    };
  }, [fixedServerId, selectedServerId]);

  useEffect(() => {
    if (!selectedServerId) return undefined;
    let isMounted = true;

    const loadChannels = async () => {
      setLoadingChannels(true);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;
      try {
        const res = await fetchDispatchChannels(selectedServerId, token);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setChannels(res.data);
          if (res.data.length > 0) {
            setSelectedChannelId(res.data[0].id);
          }
        }
      } catch {
        if (isMounted) setChannels([]);
      } finally {
        if (isMounted) setLoadingChannels(false);
      }
    };

    void loadChannels();
    return () => {
      isMounted = false;
    };
  }, [selectedServerId]);

  const handleRunPreflight = async () => {
    if (!selectedServerId || !selectedChannelId) return;
    setTestingDryRun(true);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;
    try {
      const res = await validatePreflight(
        {
          serverId: selectedServerId,
          channelId: selectedChannelId,
          payload:
            validationReport.compiledPayload as unknown as Record<string, unknown>,
        },
        token
      );
      if (res.success && res.data) {
        setServerReport(res.data);
        toast({
          type: res.data.valid ? 'success' : 'warning',
          title: res.data.valid
            ? 'Pre-Flight Verification Passed'
            : 'Pre-Flight Warnings Detected',
          description: res.data.valid
            ? 'Bot permissions and Components V2 structure verified.'
            : 'Inspect reported violations before dispatching.',
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Pre-Flight Check Failed',
        description: 'Could not reach pre-flight validation endpoint.',
      });
    } finally {
      setTestingDryRun(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedServerId || !selectedChannelId || !validationReport.valid) {
      return;
    }
    setDispatching(true);
    setStatusMessage(null);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    try {
      const payloadBody = {
        serverId: selectedServerId,
        channelId: selectedChannelId,
        dispatchType: isScheduled
          ? ('SCHEDULED_BOT' as const)
          : ('IMMEDIATE_BOT' as const),
        payload:
          validationReport.compiledPayload as unknown as Record<string, unknown>,
        ...(isScheduled && scheduledDate
          ? { scheduledFor: scheduledDate.toISOString() }
          : {}),
      };

      const res = isScheduled
        ? await scheduleEmbedDispatch(payloadBody, token)
        : await dispatchEmbed(payloadBody, token);

      if (res.success) {
        const msg = isScheduled
          ? 'Scheduled into two-phase Redis ZSET queue.'
          : 'Components V2 payload delivered to Discord channel.';
        setStatusMessage(msg);
        toast({
          type: 'success',
          title: isScheduled ? 'Dispatch Scheduled' : 'Dispatch Delivered',
          description: msg,
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Dispatch Failed',
        description:
          'Verify bot channel permissions and sliding-window rate limits.',
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PreflightLintStatusCard
        clientReport={validationReport}
        serverReport={serverReport}
      />

      {statusMessage && (
        <Alert
          variant="success"
          title="Dispatch Complete"
          description={statusMessage}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      <div className="p-5 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!fixedServerId && (
            <DispatchServerSelector
              servers={servers}
              selectedServerId={selectedServerId}
              onSelectServer={setSelectedServerId}
              loading={loadingServers}
            />
          )}

          <div className={fixedServerId ? 'md:col-span-2' : ''}>
            <DispatchChannelSelector
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
              loading={loadingChannels}
              disabled={!selectedServerId}
            />
          </div>
        </div>

        <DispatchScheduleSettings
          isScheduled={isScheduled}
          scheduledDate={scheduledDate}
          onToggleScheduled={setIsScheduled}
          onChangeScheduledDate={setScheduledDate}
        />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            loading={testingDryRun}
            disabled={!selectedServerId || !selectedChannelId}
            leftIcon={<ShieldCheck size={16} />}
            onClick={handleRunPreflight}
          >
            Run Pre-Flight Check
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            loading={dispatching}
            disabled={
              !validationReport.valid ||
              !selectedServerId ||
              !selectedChannelId ||
              (isScheduled && !scheduledDate)
            }
            leftIcon={<Send size={16} />}
            onClick={handleDispatch}
          >
            {isScheduled ? 'Schedule Dispatch' : 'Dispatch Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};
