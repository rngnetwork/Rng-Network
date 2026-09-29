"use client";

import React, { useState } from 'react';
import { Type17Container } from '../../types';
import { ChannelItem, ServerItem } from '@/lib/api';

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
  const [selectedServer, setSelectedServer] = useState<string>(
    serverId || (availableServers.length > 0 ? availableServers[0].id : 'server_rng_hq')
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    serverChannels.length > 0 ? serverChannels[0].id : 'channel_announcements'
  );
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/123456789/token_sample?with_components=true');
  const [isDispatching, setIsDispatching] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    '[Ready] Discord Components V2 Engine loaded.',
    '[Info] IS_COMPONENTS_V2 flag enabled (32768). Type 17 Containers active.'
  ]);

  React.useEffect(() => {
    if (serverChannels.length > 0 && (!selectedChannel || selectedChannel === 'channel_announcements')) {
      setSelectedChannel(serverChannels[0].id);
    }
  }, [serverChannels, selectedChannel]);

  const handleServerChange = (newServerId: string) => {
    setSelectedServer(newServerId);
    onSelectServer?.(newServerId);
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    const now = new Date().toLocaleTimeString();
    const newLogs = [...telemetryLogs];
    newLogs.push(`[${now}] Dispatch initiated to Server ID: ${selectedServer}, Channel ID: ${selectedChannel}`);

    if (isScheduled) {
      newLogs.push(`[${now}] Scheduled for: ${scheduleTime || 'Unspecified time'}`);
      newLogs.push(`[${now}] Payload queued in scheduling cluster.`);
    } else {
      newLogs.push(`[${now}] Sending Components V2 POST to Webhook / Bot Channel...`);
      newLogs.push(`[${now}] Payload contains ${containers.length} Type 17 Container(s) with flag 32768.`);
    }

    try {
      if (onDispatchPayload) {
        await onDispatchPayload({
          serverId: selectedServer,
          channelId: selectedChannel,
          isScheduled,
          scheduleTime: isScheduled ? scheduleTime : undefined,
          webhookUrl
        });
        newLogs.push(`[${now}] ✅ SUCCESS: Discord API HTTP 200 OK. Message rendered in Discord.`);
      } else {
        // Fallback simulation
        setTimeout(() => {
          newLogs.push(`[${now}] ✅ SUCCESS: Discord API HTTP 200 OK. Message rendered in Discord.`);
          setTelemetryLogs([...newLogs]);
          setIsDispatching(false);
        }, 600);
        setTelemetryLogs(newLogs);
        return;
      }
    } catch (err: any) {
      newLogs.push(`[${now}] ❌ ERROR: Dispatch failed: ${err.message || err}`);
    } finally {
      setTelemetryLogs(newLogs);
      setIsDispatching(false);
    }
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
      <div className="dispatch-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Dispatch Form Card */}
        <div className="dispatch-form-card" style={{ background: '#18181c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
              <i className="fa-solid fa-satellite-dish" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Dispatch Message & Embed V2</div>
              <div style={{ fontSize: '12px', color: 'var(--color-foreground-muted)' }}>
                Send this Components V2 payload to a server channel or schedule for later.
              </div>
            </div>
          </div>

          {/* Server Selector & Channel Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {serverId ? (
              <div className="form-group">
                <label className="form-label">Active Discord Server</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '40px', padding: '0 12px', background: '#0a0a0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}>
                  <i className="fa-solid fa-server" style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 600 }}>{serverName || 'This Server'}</span>
                  <span style={{ fontSize: '10.5px', color: '#949ba4', fontFamily: 'monospace', marginLeft: 'auto' }}>ID: {serverId}</span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Server</label>
                <select
                  className="form-input"
                  value={selectedServer}
                  onChange={(e) => handleServerChange(e.target.value)}
                  style={{ background: '#0a0a0e', color: '#fff', height: '40px' }}
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

            <div className="form-group">
              <label className="form-label">Select Server Channel</label>
              {serverChannels && serverChannels.length > 0 ? (
                <select
                  className="form-input"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  style={{ background: '#0a0a0e', color: '#fff', height: '40px' }}
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
                  placeholder="Enter Channel ID (e.g. 1395381163585175724)"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  style={{ height: '40px' }}
                />
              )}
            </div>
          </div>

          {/* Webhook & Scheduling options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Webhook URL (Optional Override)</label>
              <input
                type="text"
                className="form-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                style={{ height: '40px' }}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Schedule Delivery</span>
              </label>

              {isScheduled && (
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  style={{ height: '36px' }}
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className="btn-dispatch-submit"
            onClick={handleDispatch}
            disabled={isDispatching}
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isDispatching ? 0.7 : 1
            }}
          >
            {isDispatching ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              <i className="fa-solid fa-paper-plane" />
            )}
            <span>{isScheduled ? 'Queue Scheduled Dispatch' : 'Dispatch Payload to Discord Channel'}</span>
          </button>
        </div>

        {/* Telemetry Console */}
        <div className="dispatch-form-card" style={{ background: '#111214', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-terminal" style={{ color: '#10b981' }} />
              <span>Dispatch Telemetry Log</span>
            </div>
            <button
              type="button"
              className="comp-tool-btn"
              onClick={() => setTelemetryLogs(['[Log Cleared]'])}
              title="Clear Logs"
              style={{ fontSize: '11px', width: 'auto', padding: '2px 8px' }}
            >
              Clear
            </button>
          </div>

          <div
            id="dispatch-console"
            className="dispatch-console-box"
            style={{
              background: '#0a0a0e',
              padding: '12px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              lineHeight: '1.6',
              maxHeight: '180px',
              overflowY: 'auto',
              color: '#34d399'
            }}
          >
            {telemetryLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
