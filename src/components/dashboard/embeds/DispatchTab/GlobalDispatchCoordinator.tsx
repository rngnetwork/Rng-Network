'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Send, ShieldCheck, Server, Hash } from 'lucide-react';
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
import {
  getDefaultUserTimezone,
  zonedTimeToUtcIso,
  formatUtcPreview,
} from '@/lib/timezones';
import { Button } from '@/components/common/input/Button';
import { Alert } from '@/components/common/feedback/Alert';
import { useToast } from '@/components/common/feedback/ToastProvider';
import { DispatchServerSelector } from './DispatchServerSelector';
import { DispatchChannelSelector } from './DispatchChannelSelector';
import { DispatchScheduleSettings } from './DispatchScheduleSettings';
import { PreflightLintStatusCard } from './PreflightLintStatusCard';
import { DispatchLogsViewer, type DispatchLogEntry } from './DispatchLogsViewer';

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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
    getDefaultUserTimezone()
  );

  const computedUtcIso = useMemo(() => {
    if (!isScheduled || !selectedDate || !selectedTime) return '';
    try {
      return zonedTimeToUtcIso(selectedDate, selectedTime, selectedTimezone);
    } catch {
      return '';
    }
  }, [isScheduled, selectedDate, selectedTime, selectedTimezone]);

  const utcPreview = useMemo(() => {
    return formatUtcPreview(computedUtcIso);
  }, [computedUtcIso]);

  const [loadingServers, setLoadingServers] = useState(!fixedServerId);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [testingDryRun, setTestingDryRun] = useState(false);
  const [serverReport, setServerReport] =
    useState<DryRunValidationReportData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLogEntry[]>([]);

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
    if (isScheduled) {
      if (
        !computedUtcIso ||
        utcPreview.formattedUtc === 'Invalid Date' ||
        utcPreview.isPast
      ) {
        toast({
          type: 'warning',
          title: 'Invalid Schedule Time',
          description: utcPreview.isPast
            ? `Scheduled dispatch time must be in the future (Target UTC is ${utcPreview.relativeText}).`
            : 'Invalid schedule date/time or timezone configuration.',
        });
        return;
      }
    }

    setDispatching(true);
    setStatusMessage(null);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('rng_access_token') ||
          localStorage.getItem('accessToken') ||
          undefined
        : undefined;

    const currentServerName =
      servers.find((s) => s.id === selectedServerId)?.name || selectedServerId;
    const currentChannelName =
      channels.find((c) => c.id === selectedChannelId)?.name || selectedChannelId;

    try {
      const payloadBody = {
        serverId: selectedServerId,
        channelId: selectedChannelId,
        dispatchType: isScheduled
          ? ('SCHEDULED_BOT' as const)
          : ('IMMEDIATE_BOT' as const),
        payload:
          validationReport.compiledPayload as unknown as Record<string, unknown>,
        ...(isScheduled && computedUtcIso
          ? { scheduledFor: computedUtcIso }
          : {}),
      };

      const res = isScheduled
        ? await scheduleEmbedDispatch(payloadBody, token)
        : await dispatchEmbed(payloadBody, token);

      if (res.success) {
        const msg = isScheduled
          ? `Scheduled into two-phase Redis ZSET queue for ${selectedDate} at ${selectedTime} (${utcPreview.formattedUtc}).`
          : 'Components V2 payload delivered to Discord channel via official bot REST API.';
        setStatusMessage(msg);

        const newLog: DispatchLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          server: currentServerName,
          channel: currentChannelName,
          status: isScheduled ? 'SCHEDULED' : 'SUCCESS',
          message: msg,
        };
        setDispatchLogs((prev) => [newLog, ...prev]);

        toast({
          type: 'success',
          title: isScheduled ? 'Dispatch Scheduled' : 'Dispatch Delivered',
          description: msg,
        });
      }
    } catch {
      const errorMsg = 'Failed to dispatch payload. Check rate limits and bot channel permissions.';
      const newLog: DispatchLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        server: currentServerName,
        channel: currentChannelName,
        status: 'FAILED',
        message: errorMsg,
      };
      setDispatchLogs((prev) => [newLog, ...prev]);

      toast({
        type: 'error',
        title: 'Dispatch Failed',
        description: errorMsg,
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {statusMessage && (
        <Alert
          variant="success"
          title="Dispatch Execution Telemetry"
          description={statusMessage}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Destination & Dispatch Settings */}
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col gap-4 shadow-apple-card">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
              <Server size={16} className="text-brand-red" />
              <h3 className="text-sm font-bold text-white">Target Discord Destination</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!fixedServerId && (
                <DispatchServerSelector
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onSelectServer={setSelectedServerId}
                  loading={loadingServers}
                />
              )}

              <div className={fixedServerId ? 'sm:col-span-2' : ''}>
                <DispatchChannelSelector
                  channels={channels}
                  selectedChannelId={selectedChannelId}
                  onSelectChannel={setSelectedChannelId}
                  loading={loadingChannels}
                  disabled={!selectedServerId}
                />
              </div>
            </div>
          </div>

          <DispatchScheduleSettings
            isScheduled={isScheduled}
            onToggleScheduled={setIsScheduled}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            selectedTime={selectedTime}
            onChangeTime={setSelectedTime}
            selectedTimezone={selectedTimezone}
            onChangeTimezone={setSelectedTimezone}
            utcPreview={utcPreview}
          />

          <div className="p-4 rounded-apple-xl bg-surface-card border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-apple-card">
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={testingDryRun}
              disabled={!selectedServerId || !selectedChannelId}
              leftIcon={<ShieldCheck size={16} />}
              onClick={handleRunPreflight}
            >
              Run Pre-Flight Lint
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
                (isScheduled && (!computedUtcIso || utcPreview.isPast))
              }
              leftIcon={<Send size={16} />}
              onClick={handleDispatch}
            >
              {isScheduled ? 'Schedule Dispatch' : 'Dispatch Now'}
            </Button>
          </div>
        </div>

        {/* Right Column: Preflight Lint & Live Logs */}
        <div className="flex flex-col gap-5">
          <PreflightLintStatusCard
            clientReport={validationReport}
            serverReport={serverReport}
          />

          <DispatchLogsViewer
            logs={dispatchLogs}
            onClear={() => setDispatchLogs([])}
          />
        </div>
      </div>
    </div>
  );
};
