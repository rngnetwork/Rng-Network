"use client";

import React, { useState } from 'react';
import { Type17Container } from '../../types';
import { ChannelItem, ServerItem } from '@/lib/api';

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
    webhookUrl?: string;
  }) => Promise<void> | void;
}

export function DispatchTab({
  containers,
  serverId,
  serverName,
  serverChannels = [],
  availableServers = [],
  onSelectServer,
  onDispatchPayload
}: DispatchTabProps) {
  // 1. Heading & Subheading
  const heading = "Dispatch Embed Message!";
  const subheading = "Send this message to your selected server and channel";

  // 2. Form State
  const [selectedServer, setSelectedServer] = useState<string>(
    serverId || (availableServers.length > 0 ? availableServers[0].id : 'server_rng_hq')
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    serverChannels.length > 0 ? serverChannels[0].id : 'channel_announcements'
  );
  const [scheduleEnabler, setScheduleEnabler] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

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

  const activeChannelId = serverChannels.length > 0
    ? (serverChannels.some((c) => c.id === selectedChannel) ? selectedChannel : serverChannels[0].id)
    : selectedChannel;

  const handleServerChange = (newServerId: string) => {
    setSelectedServer(newServerId);
    onSelectServer?.(newServerId);
  };

  const currentServerLabel = availableServers.find((s) => s.id === selectedServer)?.name || serverName || selectedServer;
  const currentChannelLabel = serverChannels.find((c) => c.id === activeChannelId)?.name || activeChannelId;

  // Dispatch Action
  const handleDispatch = async () => {
    setIsDispatching(true);
    const now = new Date().toLocaleTimeString();
    const scheduledDateTime = scheduleEnabler ? `${selectedDate}T${selectedTime}:00` : undefined;

    const entryId = `dispatch_${Date.now()}`;
    const initialLog: DispatchLogEntry = {
      id: entryId,
      timestamp: now,
      server: currentServerLabel,
      channel: `#${currentChannelLabel}`,
      status: scheduleEnabler ? 'SCHEDULED' : 'PENDING',
      message: scheduleEnabler
        ? `Scheduled delivery set for ${selectedDate} at ${selectedTime}. Queued in Redis orchestrator.`
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
                  ? `Message scheduled successfully for ${selectedDate} at ${selectedTime} in #${currentChannelLabel}.`
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-paper-plane" style={{ color: 'var(--discord-cyan)', fontSize: '18px' }} />
            <span>{heading}</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--discord-text-muted)', margin: 0 }}>
            {subheading}
          </p>
        </div>

        {/* Dispatch Form Card */}
        <div
          style={{
            background: '#1e1f22',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {/* Dropdown Servers & Dropdown Channels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Dropdown Servers (new.serverSelector) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#dbdee1' }}>
                Select your Server:
              </label>
              {serverId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px', padding: '0 12px', background: '#111214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}>
                  <i className="fa-solid fa-server" style={{ color: 'var(--discord-cyan)' }} />
                  <span style={{ fontWeight: 600 }}>{serverName || 'Active Discord Server'}</span>
                  <span style={{ fontSize: '11px', color: '#949ba4', fontFamily: 'monospace', marginLeft: 'auto' }}>ID: {serverId}</span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-input"
                    value={selectedServer}
                    onChange={(e) => handleServerChange(e.target.value)}
                    style={{
                      height: '42px',
                      background: '#111214',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '0 12px',
                      width: '100%',
                      fontSize: '13px'
                    }}
                  >
                    {availableServers.length > 0 ? (
                      availableServers.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} (ID: {srv.id})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="server_rng_hq">RNG Network Official HQ</option>
                        <option value="server_community">RNG Community Guild</option>
                        <option value="server_dev">RNG Bot Development Lab</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Dropdown Channels (new.channelSelector) */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#dbdee1' }}>
                Select your channel:
              </label>
              {serverChannels && serverChannels.length > 0 ? (
                <select
                  className="form-input"
                  value={activeChannelId}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  style={{
                    height: '42px',
                    background: '#111214',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0 12px',
                    width: '100%',
                    fontSize: '13px'
                  }}
                >
                  {serverChannels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      #{ch.name} (ID: {ch.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Channel ID or name (e.g. 1395381163585175724)"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  style={{
                    height: '42px',
                    background: '#111214',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
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
              padding: '12px 14px',
              background: '#111214',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-regular fa-clock" style={{ color: scheduleEnabler ? '#fbbf24' : 'var(--discord-text-muted)', fontSize: '16px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Enable Scheduler</div>
                <div style={{ fontSize: '11px', color: 'var(--discord-text-muted)' }}>
                  {scheduleEnabler
                    ? `Dispatch scheduled for ${selectedDate} at ${selectedTime}`
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
                    fontSize: '11px',
                    color: 'var(--discord-cyan)',
                    background: 'rgba(0, 168, 252, 0.1)',
                    border: '1px solid rgba(0, 168, 252, 0.3)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
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
                  padding: '2px'
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

          {/* Inline Scheduler Selectors (DateSelector & TimeSelector) */}
          {scheduleEnabler && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                padding: '14px',
                background: 'rgba(251, 191, 36, 0.04)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '8px'
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
                    height: '38px',
                    background: '#111214',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0 10px',
                    fontSize: '12.5px'
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
                    height: '38px',
                    background: '#111214',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0 10px',
                    fontSize: '12.5px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Button dispatchMessage = new messageSend(); */}
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isDispatching}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: scheduleEnabler ? '#f59e0b' : 'var(--discord-blurple)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isDispatching ? 'not-allowed' : 'pointer',
              opacity: isDispatching ? 0.7 : 1,
              transition: 'background 0.15s ease, transform 0.1s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
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
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              backdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsSchedulerModalOpen(false);
            }}
          >
            <div
              className="modal-dialog"
              style={{
                maxWidth: '440px',
                width: '100%',
                background: '#2b2d31',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-regular fa-calendar-days" style={{ color: '#fbbf24' }} />
                  <span>Configure Scheduler</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSchedulerModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--discord-text-muted)', cursor: 'pointer', fontSize: '14px' }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#dbdee1', marginBottom: '4px', display: 'block' }}>DateSelector:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '100%', height: '38px', background: '#1e1f22', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#dbdee1', marginBottom: '4px', display: 'block' }}>TimeSelector:</label>
                  <input
                    type="time"
                    className="form-input"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{ width: '100%', height: '38px', background: '#1e1f22', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 10px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsSchedulerModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--discord-blurple)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
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
        background: '#111214',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-list-check" style={{ color: 'var(--discord-cyan)' }} />
          <span>DispatchLogsViewer</span>
          <span style={{ fontSize: '11px', color: 'var(--discord-text-muted)', fontWeight: 500 }}>
            ({logs.length} event{logs.length === 1 ? '' : 's'})
          </span>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            className="comp-tool-btn"
            onClick={onClear}
            title="Clear Log History"
            style={{ fontSize: '11px', width: 'auto', padding: '3px 10px' }}
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
          maxHeight: '260px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--discord-text-muted)', fontSize: '12.5px' }}>
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
                padding: '10px 12px',
                background: '#18191c',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', color: '#949ba4', fontSize: '11px' }}>
                    [{item.timestamp}]
                  </span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>
                    {item.server}
                  </span>
                  <span style={{ color: 'var(--discord-cyan)', fontWeight: 500 }}>
                    {item.channel}
                  </span>
                </div>
                <div style={{ color: '#dbdee1', fontSize: '11.5px', wordBreak: 'break-word' }}>
                  {item.message}
                </div>
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
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
                      ? '#23a55a'
                      : item.status === 'SCHEDULED'
                      ? '#fbbf24'
                      : item.status === 'PENDING'
                      ? '#5865f2'
                      : '#ef4444',
                  border: `1px solid ${
                    item.status === 'SUCCESS'
                      ? 'rgba(35, 165, 90, 0.3)'
                      : item.status === 'SCHEDULED'
                      ? 'rgba(251, 191, 36, 0.3)'
                      : item.status === 'PENDING'
                      ? 'rgba(88, 101, 242, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`
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
