'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Send, Server } from 'lucide-react';
import type { ClientValidationReport } from '@/lib/model/embed';
import type { ServerItem } from '@/lib/model/server';
import type { ChannelItem } from '@/lib/model/channel';
import { fetchRegisteredServers } from '@/lib/api/dashboard/servers';
import {
  fetchDispatchChannels,
  dispatchEmbed,
  scheduleEmbedDispatch,
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
        setLoadingServers(true);
        const res = await fetchRegisteredServers(token);
        if (isMounted && res.success && res.data) {
          setServers(res.data);
          if (res.data.length > 0 && !selectedServerId) {
            setSelectedServerId(res.data[0].id);
          }
        }
      } catch {
        if (isMounted) {
          toast({
            type: 'error',
            title: 'Server Discovery Failed',
            description: 'Could not fetch mutual registered Discord servers.',
          });
        }
      } finally {
        if (isMounted) setLoadingServers(false);
      }
    };

    void loadServers();
    return () => {
      isMounted = false;
    };
  }, [fixedServerId, selectedServerId, toast]);

  useEffect(() => {
    if (!selectedServerId) {
      return;
    }

    let isMounted = true;
    const loadChannels = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('rng_access_token') ||
            localStorage.getItem('accessToken') ||
            undefined
          : undefined;

      try {
        setLoadingChannels(true);
        const res = await fetchDispatchChannels(selectedServerId, token);
        if (isMounted && res.success && res.data) {
          setChannels(res.data);
          if (res.data.length > 0) {
            setSelectedChannelId((prev) =>
              res.data.some((c) => c.id === prev) ? prev : res.data[0].id
            );
          } else {
            setSelectedChannelId('');
          }
        }
      } catch {
        if (isMounted) {
          toast({
            type: 'error',
            title: 'Channel Discovery Failed',
            description: `Could not load channels for server ${selectedServerId}.`,
          });
        }
      } finally {
        if (isMounted) setLoadingChannels(false);
      }
    };

    void loadChannels();
    return () => {
      isMounted = false;
    };
  }, [selectedServerId, toast]);

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
          ? `Scheduled into Redis queue for ${selectedDate} at ${selectedTime} (${utcPreview.formattedUtc}).`
          : 'Components V2 payload delivered to Discord channel via official bot REST API.';
        setStatusMessage(msg);

        const newLog: DispatchLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          server: currentServerName,
          channel: currentChannelName,
          status: isScheduled ? 'SCHEDULED' : 'SUCCESS',
          message: msg,
          statusCode: '200',
        };
        setDispatchLogs((prev) => [newLog, ...prev]);

        toast({
          type: 'success',
          title: isScheduled ? 'Dispatch Scheduled' : 'Dispatch Delivered',
          description: msg,
        });
      }
    } catch (err: unknown) {
      let statusCode: number | string = 'ERR';
      let errorTitle = 'Dispatch Failed';
      let errorDetail = '';
      let rawBackendPayload: unknown = null;

      if (err && typeof err === 'object') {
        const anyErr = err as Record<string, unknown>;
        if (typeof anyErr.status === 'number') {
          statusCode = anyErr.status;
        } else if (anyErr.response && typeof (anyErr.response as Record<string, unknown>).status === 'number') {
          statusCode = (anyErr.response as Record<string, unknown>).status as number;
        }

        const payload = (anyErr.payload || (anyErr.response as Record<string, unknown>)?.data || anyErr.problemDetails) as Record<string, unknown> | undefined;
        rawBackendPayload = payload;

        if (payload) {
          if (typeof payload.code === 'number') {
            errorTitle = `Discord Error ${payload.code}`;
          } else if (typeof payload.title === 'string') {
            errorTitle = payload.title;
          }

          if (typeof payload.detail === 'string') {
            errorDetail = payload.detail;
          } else if (typeof payload.message === 'string') {
            errorDetail = payload.message;
          } else if (payload.errors && typeof payload.errors === 'object') {
            errorDetail = JSON.stringify(payload.errors, null, 2);
          }
        }

        if (!errorDetail && typeof anyErr.message === 'string') {
          errorDetail = anyErr.message;
        }
      }

      if (!errorDetail) {
        errorDetail = 'Failed to dispatch payload. Check rate limits and bot channel permissions.';
      }

      const logMessage = `HTTP ${statusCode}: ${errorTitle}\n↳ ${errorDetail}`;

      const newLog: DispatchLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        server: currentServerName,
        channel: currentChannelName,
        status: 'FAILED',
        message: logMessage,
        statusCode: String(statusCode),
        rawDetails: rawBackendPayload ? JSON.stringify(rawBackendPayload, null, 2) : undefined,
      };
      setDispatchLogs((prev) => [newLog, ...prev]);

      toast({
        type: 'error',
        title: `Dispatch Failed (${statusCode})`,
        description: errorDetail.length > 100 ? `${errorDetail.slice(0, 100)}...` : errorDetail,
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      {statusMessage && (
        <Alert
          variant="success"
          title="Dispatch Telemetry"
          description={statusMessage}
          onDismiss={() => setStatusMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0 items-stretch">
        {/* Left Container: Target Destination + Scheduler + Dispatch Button */}
        <div className="p-5 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col justify-between gap-5 shadow-apple-card h-full flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
                <Server size={16} className="text-brand-red" />
                <h3 className="text-sm font-bold text-white">Target Discord Destination</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!fixedServerId && (
                  <DispatchServerSelector
                    servers={servers}
                    selectedServerId={selectedServerId}
                    onSelectServer={(srvId) => { setSelectedServerId(srvId); setChannels([]); setSelectedChannelId(''); }}
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

            <div className="pt-2 border-t border-white/[0.06]">
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
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex justify-end">
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
              className="w-full sm:w-auto"
            >
              {isScheduled ? 'Schedule Dispatch' : 'Dispatch Now'}
            </Button>
          </div>
        </div>

        {/* Right Container: macOS Terminal Logs */}
        <div className="flex flex-col h-full flex-1 min-h-0">
          <DispatchLogsViewer
            logs={dispatchLogs}
            onClear={() => setDispatchLogs([])}
          />
        </div>
      </div>
    </div>
  );
};
