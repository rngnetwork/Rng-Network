"use client";

import React, { useState, useMemo } from 'react';
import { Type17Container, ClientValidationReport } from '../../types';
import { ChannelItem, ServerItem } from '@/lib/api';
import { GlassmorphicDropdown, DropdownOption } from '@/components/ui/GlassmorphicDropdown';
import { validateContainers } from '../../validation';
import {
  TIMEZONE_OPTIONS,
  getDefaultUserTimezone,
  zonedTimeToUtcIso,
  formatUtcPreview
} from '@/lib/timezones';

interface DispatchLogEntry {
  id: string;
  timestamp: string;
  server: string;
  channel: string;
  status: 'SUCCESS' | 'SCHEDULED' | 'FAILED' | 'PENDING';
  message: string;
}

interface DispatchTabProps {
  containers: Type17Container[];
  messageContent: string;
  serverId?: string;
  serverName?: string;
  serverChannels?: ChannelItem[];
  availableServers?: ServerItem[];
  onSelectServer?: (serverId: string) => void;
  onDispatchPayload?: (payload: {
    serverId: string;
    channelId: string;
    isScheduled: boolean;
    scheduleTime?: string;
  }) => Promise<void> | void;
  lockServer?: boolean;
}

export function DispatchTab({
  containers,
  messageContent = '',
  serverId,
  serverName,
  serverChannels = [],
  availableServers = [],
  onSelectServer,
  onDispatchPayload,
  lockServer = false
}: DispatchTabProps) {
  // 1. Heading & Subheading
  const heading = "Dispatch Embed Message!";
  const subheading = "Send this message to your selected server and channel";

  // 2. Form State
  const [userSelectedServer, setUserSelectedServer] = useState<string>('');
  const [userSelectedChannel, setUserSelectedChannel] = useState<string>('');
  const [scheduleEnabler, setScheduleEnabler] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => getDefaultUserTimezone());
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  const timezoneDropdownOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = TIMEZONE_OPTIONS.map((tz) => ({
      value: tz.value,
      label: tz.label,
      description: `${tz.region} • ${tz.value}`
    }));

    const isPredefined = TIMEZONE_OPTIONS.some((tz) => tz.value === selectedTimezone);
    if (selectedTimezone && !isPredefined) {
      options.unshift({
        value: selectedTimezone,
        label: `(System Local) ${selectedTimezone}`,
        description: `Local System Timezone: ${selectedTimezone}`
      });
    }

    return options;
  }, [selectedTimezone]);

  const computedUtcIso = useMemo(() => {
    if (!scheduleEnabler || !selectedDate || !selectedTime) {
      return '';
    }
    try {
      return zonedTimeToUtcIso(selectedDate, selectedTime, selectedTimezone);
    } catch {
      return '';
    }
  }, [scheduleEnabler, selectedDate, selectedTime, selectedTimezone]);

  const utcPreview = useMemo(() => {
    return formatUtcPreview(computedUtcIso);
  }, [computedUtcIso]);

  // Derived Server & Channel Selection (computed purely during render)
  const selectedServer = userSelectedServer || serverId || (availableServers.length > 0 ? availableServers[0].id : '');

  const activeChannelId = useMemo(() => {
    if (userSelectedChannel && serverChannels.some((c) => c.id === userSelectedChannel)) {
      return userSelectedChannel;
    }
    if (serverChannels.length > 0) {
      return serverChannels[0].id;
    }
    return userSelectedChannel || '';
  }, [userSelectedChannel, serverChannels]);

  // Pre-Flight Validation Report
  const validationReport: ClientValidationReport = useMemo(() => {
    return validateContainers(containers, messageContent);
  }, [containers, messageContent]);

  // 3. Dispatch Logs State
  const [logs, setLogs] = useState<DispatchLogEntry[]>([
    {
      id: 'log_ready',
      timestamp: new Date().toLocaleTimeString(),
      server: serverName || 'System',
      channel: 'engine',
      status: 'SUCCESS',
      message: 'Discord Components V2 Dispatch Engine initialized. Ready for dispatch.'
    }
  ]);

  const serverDropdownOptions: DropdownOption[] = useMemo(() => {
    if (availableServers && availableServers.length > 0) {
      return availableServers.map((srv) => ({
        value: srv.id,
        label: srv.name,
        description: `Server ID: ${srv.id}`,
        badge: srv.totalCount ? `${srv.totalCount} members` : undefined
      }));
    }
    return [
      { value: "server_rng_hq", label: "RNG Network Official HQ", description: "Primary Command Guild" },
      { value: "server_community", label: "RNG Community Guild", description: "Public Discussion" },
      { value: "server_dev", label: "RNG Bot Development Lab", description: "Testing & Staging" }
    ];
  }, [availableServers]);

  const channelDropdownOptions: DropdownOption[] = useMemo(() => {
    return (serverChannels || []).map((ch) => {
      let badge = 'Text';
      let icon = '#';
      if (ch.type === 5) {
        badge = 'Announcement';
        icon = '📢';
      } else if (ch.type === 2) {
        badge = 'Voice';
        icon = '🔊';
      } else if (ch.type === 15) {
        badge = 'Forum';
        icon = '💬';
      }
      return {
        value: ch.id,
        label: `${icon} ${ch.name}`,
        description: `Channel ID: ${ch.id}`,
        badge
      };
    });
  }, [serverChannels]);

  const handleServerChange = (newServerId: string) => {
    setUserSelectedServer(newServerId);
    setUserSelectedChannel('');
    onSelectServer?.(newServerId);
  };

  const currentServerLabel = availableServers.find((s) => s.id === selectedServer)?.name || serverName || selectedServer;
  const currentChannelLabel = serverChannels.find((c) => c.id === activeChannelId)?.name || activeChannelId;

  // Dispatch Action
  const handleDispatch = async () => {
    const now = new Date().toLocaleTimeString();
    let scheduledDateTime: string | undefined = undefined;

    if (scheduleEnabler) {
      if (!computedUtcIso || utcPreview.formattedUtc === 'Invalid Date' || utcPreview.isPast) {
        const failureReason = (!computedUtcIso || utcPreview.formattedUtc === 'Invalid Date')
          ? 'Invalid schedule date/time or timezone configuration.'
          : `Scheduled dispatch time must be in the future (Target UTC is ${utcPreview.relativeText}).`;

        setLogs((prev) => [
          {
            id: `dispatch_${Date.now()}`,
            timestamp: now,
            server: currentServerLabel,
            channel: `#${currentChannelLabel}`,
            status: 'FAILED',
            message: `Dispatch aborted: ${failureReason}`
          },
          ...prev
        ]);
        return;
      }
      scheduledDateTime = computedUtcIso;
    }

    setIsDispatching(true);

    const entryId = `dispatch_${Date.now()}`;
    const initialLog: DispatchLogEntry = {
      id: entryId,
      timestamp: now,
      server: currentServerLabel,
      channel: `#${currentChannelLabel}`,
      status: scheduleEnabler ? 'SCHEDULED' : 'PENDING',
      message: scheduleEnabler
        ? `Scheduled delivery set for ${selectedDate} at ${selectedTime} (${utcPreview.formattedUtc}). Queued in Redis orchestrator.`
        : `Dispatch initiated with ${containers.length} container(s). Sending payload to Discord...`
    };

    setLogs((prev) => [initialLog, ...prev]);

    try {
      if (onDispatchPayload) {
        await onDispatchPayload({
          serverId: selectedServer,
          channelId: activeChannelId,
          isScheduled: scheduleEnabler,
          scheduleTime: scheduledDateTime
        });
      } else {
        // Fallback simulation delay
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      setLogs((prev) =>
        prev.map((item) =>
          item.id === entryId
            ? {
                ...item,
                status: scheduleEnabler ? 'SCHEDULED' : 'SUCCESS',
                message: scheduleEnabler
                  ? `Message scheduled successfully for ${selectedDate} at ${selectedTime} (${utcPreview.formattedUtc}) in #${currentChannelLabel}.`
                  : `Dispatched successfully to #${currentChannelLabel} (HTTP 200 OK).`
              }
            : item
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLogs((prev) =>
        prev.map((item) =>
          item.id === entryId
            ? {
                ...item,
                status: 'FAILED',
                message: `Dispatch failed: ${msg}`
              }
            : item
        )
      );
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Heading & Subheading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(225, 29, 46, 0.12)', border: '1px solid rgba(225, 29, 46, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(225, 29, 46, 0.25)' }}>
            <i className="fa-solid fa-paper-plane" style={{ color: '#E11D2E', fontSize: '18px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              {heading}
            </h1>
            <p style={{ fontSize: '12.5px', color: '#949ba4', margin: 0 }}>
              {subheading}
            </p>
          </div>
        </div>

        {/* Dispatch Form Card */}
        <div
          className="dispatch-form-card"
          style={{
            background: 'rgba(13, 14, 18, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
          }}
        >
          {/* Dropdown Servers & Dropdown Channels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
            
            {/* Dropdown Servers (new.serverSelector) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#dbdee1' }}>
                Select your Server:
              </label>
              {lockServer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px', padding: '0 12px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}>
                  <i className="fa-brands fa-discord text-indigo-400" />
                  <span style={{ fontWeight: 600 }}>{serverName || 'Active Discord Server'}</span>
                  <span style={{ fontSize: '11px', color: '#949ba4', fontFamily: 'monospace', marginLeft: 'auto' }}>ID: {serverId}</span>
                </div>
              ) : (
                <GlassmorphicDropdown
                  value={selectedServer}
                  options={serverDropdownOptions}
                  onChange={(val) => handleServerChange(String(val))}
                  placeholder="Select Discord Server..."
                  searchable={serverDropdownOptions.length > 5}
                />
              )}
            </div>

            {/* Dropdown Channels (new.channelSelector) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#dbdee1' }}>
                Select your channel:
              </label>
              {serverChannels && serverChannels.length > 0 ? (
                <GlassmorphicDropdown
                  value={activeChannelId}
                  options={channelDropdownOptions}
                  onChange={(val) => setUserSelectedChannel(String(val))}
                  placeholder="Select Discord Channel..."
                  searchable={channelDropdownOptions.length > 5}
                />
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Channel ID or name (e.g. 1395381163585175724)"
                  value={userSelectedChannel || activeChannelId}
                  onChange={(e) => setUserSelectedChannel(e.target.value)}
                  style={{
                    height: '42px',
                    background: '#090a0d',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0 12px',
                    width: '100%',
                    fontSize: '13px'
                  }}
                />
              )}
            </div>
          </div>

          {/* Toggle scheduleEnabler (new.scheduleToggle) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: scheduleEnabler ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)', border: scheduleEnabler ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-regular fa-clock" style={{ color: scheduleEnabler ? '#fbbf24' : '#949ba4', fontSize: '15px' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Enable Scheduler</div>
                <div style={{ fontSize: '11px', color: '#949ba4' }}>
                  {scheduleEnabler
                    ? `Dispatch scheduled for ${selectedDate} at ${selectedTime}${utcPreview.formattedUtc !== 'Invalid Date' ? ` (${utcPreview.formattedUtc})` : ''}`
                    : 'Send immediately upon click'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {scheduleEnabler && (
                <button
                  type="button"
                  onClick={() => setIsSchedulerModalOpen(true)}
                  style={{
                    fontSize: '11.5px',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Edit Schedule Time
                </button>
              )}

              {/* iOS / Discord styled toggle switch */}
              <button
                type="button"
                onClick={() => setScheduleEnabler(!scheduleEnabler)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: scheduleEnabler ? '#23a55a' : '#4e5058',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: '2px',
                  boxShadow: scheduleEnabler ? '0 0 12px rgba(35, 165, 90, 0.4)' : 'none'
                }}
                title={scheduleEnabler ? 'Disable Scheduler' : 'Enable Scheduler'}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'transform 0.2s ease',
                    transform: scheduleEnabler ? 'translateX(20px)' : 'translateX(0px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Inline Scheduler Selectors (DateSelector, TimeSelector, TimezoneSelector) */}
          {scheduleEnabler && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '12px'
                }}
              >
                {/* new DateSelector() */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" /> DateSelector:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      height: '42px',
                      background: '#090a0d',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '12.5px',
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                {/* new TimeSelector() */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-clock" /> TimeSelector:
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{
                      height: '42px',
                      background: '#090a0d',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '12.5px',
                      colorScheme: 'dark'
                    }}
                  />
                </div>

                {/* TimezoneSelector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-globe" /> TimezoneSelector:
                  </label>
                  <GlassmorphicDropdown
                    value={selectedTimezone}
                    options={timezoneDropdownOptions}
                    onChange={(val) => setSelectedTimezone(String(val))}
                    placeholder="Select Timezone..."
                    searchable={true}
                    searchPlaceholder="Search timezone or city..."
                  />
                </div>
              </div>

              {/* Live UTC Conversion & Validation Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${utcPreview.isPast ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.25)'}`,
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <i
                    className={utcPreview.isPast ? 'fa-solid fa-triangle-exclamation text-red-400' : 'fa-solid fa-clock-rotate-left text-emerald-400'}
                  />
                  <span style={{ color: '#949ba4', fontWeight: 500 }}>Target UTC:</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>
                    {utcPreview.formattedUtc}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      background: utcPreview.isPast ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: utcPreview.isPast ? '#f87171' : '#4ade80',
                      border: `1px solid ${utcPreview.isPast ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                      fontFamily: 'monospace'
                    }}
                  >
                    {utcPreview.relativeText}
                  </span>
                  {utcPreview.isPast && (
                    <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                      (Must be in future)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Button dispatchMessage = new messageSend(); */}
          {(!validationReport.valid || (validationReport.totalContainers === 0 && !messageContent.trim())) && (
            <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <i className="fa-solid fa-lock" />
              <span>
                {validationReport.totalContainers === 0 && !messageContent.trim()
                  ? 'Dispatch locked: Payload is empty. Add at least one container or text display.'
                  : 'Dispatch locked: Resolve all pre-flight errors to enable message dispatch.'}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isDispatching || !validationReport.valid || (validationReport.totalContainers === 0 && !messageContent.trim())}
            style={{
              padding: '13px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: scheduleEnabler
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #E11D2E 0%, #b80710 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              cursor: isDispatching || !validationReport.valid || (validationReport.totalContainers === 0 && !messageContent.trim()) ? 'not-allowed' : 'pointer',
              opacity: isDispatching || !validationReport.valid || (validationReport.totalContainers === 0 && !messageContent.trim()) ? 0.5 : 1,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: scheduleEnabler
                ? '0 6px 20px rgba(245, 158, 11, 0.4)'
                : '0 6px 20px rgba(225, 29, 46, 0.45)'
            }}
          >
            {isDispatching ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              <i className={scheduleEnabler ? 'fa-solid fa-calendar-check' : 'fa-solid fa-paper-plane'} />
            )}
            <span>
              {isDispatching
                ? 'Dispatching Message...'
                : scheduleEnabler
                ? 'Queue Scheduled Message'
                : 'Send Message'}
            </span>
          </button>
        </div>

        {/* DispatchLogs logsViewer = new DispatchLogsViewer(); */}
        <DispatchLogsViewer logs={logs} onClear={() => setLogs([])} />

        {/* schedulerModal Dialog */}
        {isSchedulerModalOpen && (
          <div
            className="modal-overlay open"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSchedulerModalOpen(false);
            }}
          >
            <div
              className="modal-dialog"
              style={{
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 35px rgba(245, 158, 11, 0.12)'
              }}
            >
              <div className="modal-header">
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-regular fa-calendar-days" style={{ color: '#fbbf24', fontSize: '14px' }} />
                  </div>
                  <span>Configure Scheduler</span>
                </div>
                <button
                  type="button"
                  className="btn-container-close"
                  onClick={() => setIsSchedulerModalOpen(false)}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">DateSelector</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ height: '40px', colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">TimeSelector</label>
                  <input
                    type="time"
                    className="form-input"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{ height: '40px', colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-globe text-amber-400" />
                    <span>TimezoneSelector</span>
                  </label>
                  <GlassmorphicDropdown
                    value={selectedTimezone}
                    options={timezoneDropdownOptions}
                    onChange={(val) => setSelectedTimezone(String(val))}
                    placeholder="Select Timezone..."
                    searchable={true}
                    searchPlaceholder="Search timezone or city..."
                  />
                </div>

                {/* Live UTC Diagnostic Feedback */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${utcPreview.isPast ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.25)'}`,
                    borderRadius: '8px',
                    marginTop: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <i
                      className={utcPreview.isPast ? "fa-solid fa-triangle-exclamation text-red-400" : "fa-solid fa-clock-rotate-left text-emerald-400"}
                    />
                    <span style={{ color: '#949ba4', fontWeight: 500 }}>Target UTC:</span>
                    <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>
                      {utcPreview.formattedUtc}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        background: utcPreview.isPast ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: utcPreview.isPast ? '#f87171' : '#4ade80',
                        border: `1px solid ${utcPreview.isPast ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        fontFamily: 'monospace'
                      }}
                    >
                      {utcPreview.relativeText}
                    </span>
                    {utcPreview.isPast && (
                      <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                        (Must be in future)
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '10px 0 0 0', background: 'transparent' }}>
                  <button
                    type="button"
                    className="modal-btn-cancel"
                    onClick={() => setIsSchedulerModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-btn-save"
                    onClick={() => setIsSchedulerModalOpen(false)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    <i className="fa-solid fa-check" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. DispatchLogsViewer Component
function DispatchLogsViewer({
  logs,
  onClear
}: {
  logs: DispatchLogEntry[];
  onClear: () => void;
}) {
  return (
    <div
      style={{
        background: 'rgba(13, 14, 18, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 168, 252, 0.12)', border: '1px solid rgba(0, 168, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-list-check" style={{ color: '#38bdf8', fontSize: '13px' }} />
          </div>
          <span>DispatchLogsViewer</span>
          <span style={{ fontSize: '11px', color: '#949ba4', fontWeight: 500, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
            {logs.length} event{logs.length === 1 ? '' : 's'}
          </span>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            className="comp-tool-btn"
            onClick={onClear}
            title="Clear Log History"
            style={{ fontSize: '11.5px', width: 'auto', padding: '4px 12px', borderRadius: '6px' }}
          >
            Clear Logs
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '280px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 10px', color: '#949ba4', fontSize: '13px' }}>
            No dispatches executed yet. Send an embed message above to view live dispatch logs.
          </div>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                background: '#08090c',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                fontSize: '12.5px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#949ba4', fontSize: '11px' }}>
                    [{item.timestamp}]
                  </span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>
                    {item.server}
                  </span>
                  <span style={{ color: 'var(--discord-cyan)', fontWeight: 500 }}>
                    {item.channel}
                  </span>
                </div>
                <div style={{ color: '#dbdee1', fontSize: '12px', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {item.message}
                </div>
              </div>

              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  background:
                    item.status === 'SUCCESS'
                      ? 'rgba(35, 165, 90, 0.15)'
                      : item.status === 'SCHEDULED'
                      ? 'rgba(251, 191, 36, 0.15)'
                      : item.status === 'PENDING'
                      ? 'rgba(88, 101, 242, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color:
                    item.status === 'SUCCESS'
                      ? '#4ade80'
                      : item.status === 'SCHEDULED'
                      ? '#fbbf24'
                      : item.status === 'PENDING'
                      ? '#a5b4fc'
                      : '#f87171',
                  border:
                    item.status === 'SUCCESS'
                      ? '1px solid rgba(35, 165, 90, 0.35)'
                      : item.status === 'SCHEDULED'
                      ? '1px solid rgba(251, 191, 36, 0.35)'
                      : item.status === 'PENDING'
                      ? '1px solid rgba(88, 101, 242, 0.35)'
                      : '1px solid rgba(239, 68, 68, 0.35)'
                }}
              >
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
