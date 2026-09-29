"use client";

import React from 'react';
import { Type17Container, DiscordButtonComponent, DiscordSelectComponent } from '../../types';

interface PreviewTabProps {
  messageContent: string;
  containers: Type17Container[];
}

export function PreviewTab({
  messageContent,
  containers
}: PreviewTabProps) {
  // Simple markdown renderer for live Discord preview
  const renderDiscordMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {lines.map((line, idx) => {
          let formattedLine: React.ReactNode = line;

          if (line.startsWith('### ')) {
            formattedLine = <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0', color: '#fff' }}>{line.replace('### ', '')}</h3>;
          } else if (line.startsWith('## ')) {
            formattedLine = <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0', color: '#fff' }}>{line.replace('## ', '')}</h2>;
          } else if (line.startsWith('# ')) {
            formattedLine = <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0', color: '#fff' }}>{line.replace('# ', '')}</h1>;
          } else if (line.startsWith('> ')) {
            formattedLine = (
              <div style={{ borderLeft: '4px solid #4e5058', paddingLeft: '8px', color: '#dbdee1' }}>
                {line.replace('> ', '')}
              </div>
            );
          } else if (line.startsWith('-# ')) {
            formattedLine = (
              <span style={{ fontSize: '11px', color: '#949ba4' }}>
                {line.replace('-# ', '')}
              </span>
            );
          } else if (line.startsWith('• ') || line.startsWith('- ')) {
            formattedLine = (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: 'var(--discord-cyan)' }}>•</span>
                <span>{line.replace(/^([•-]\s*)/, '')}</span>
              </div>
            );
          }

          return <div key={idx}>{formattedLine}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div className="preview-board-container" style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Discord Authentic Message Container */}
        <div className="discord-message" style={{ display: 'flex', gap: '14px', padding: '12px 16px', background: '#313338', borderRadius: '8px' }}>
          {/* Bot Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00A8FC, #5865F2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#fff',
                fontSize: '14px'
              }}
            >
              RNG
            </div>
          </div>

          {/* Message Content & Containers */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Bot Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>RNG Bot</span>
              <span
                style={{
                  background: '#5865f2',
                  color: '#fff',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  textTransform: 'uppercase'
                }}
              >
                APP
              </span>
              <span style={{ fontSize: '11px', color: '#949ba4' }}>
                Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Normal Text Content */}
            {messageContent && (
              <div style={{ fontSize: '14px', color: '#dbdee1', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {renderDiscordMarkdown(messageContent)}
              </div>
            )}

            {/* Type 17 Containers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {containers.map((container, cIdx) => (
                <div
                  key={container.id || cIdx}
                  className="preview-type17-container"
                  style={{
                    borderLeft: `4px solid ${container.accentColor || '#00A8FC'}`,
                    background: '#2b2d31',
                    borderRadius: '4px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxWidth: '520px',
                    position: 'relative'
                  }}
                >
                  {container.isSpoiler && (
                    <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '10px', background: '#111214', color: '#949ba4', padding: '2px 6px', borderRadius: '3px' }}>
                      SPOILER
                    </div>
                  )}

                  {/* Author Header */}
                  {container.author?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {container.author.icon_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={container.author.icon_url}
                          alt="Author Icon"
                          style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                        {container.author.name}
                      </span>
                    </div>
                  )}

                  {/* Title & Description with optional Thumbnail */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {container.title && (
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                          {container.title}
                        </div>
                      )}
                      {container.description && (
                        <div style={{ fontSize: '13px', color: '#dbdee1', lineHeight: '1.35' }}>
                          {renderDiscordMarkdown(container.description)}
                        </div>
                      )}
                    </div>
                    {container.thumbnail && (
                      <div style={{ flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={container.thumbnail}
                          alt="Thumbnail"
                          style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fields Grid */}
                  {container.fields && container.fields.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {container.fields.map((f, fIdx) => (
                        <div key={f.id || fIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{f.name}</span>
                          <span style={{ fontSize: '12px', color: '#dbdee1' }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Banner Image */}
                  {container.image && (
                    <div style={{ borderRadius: '4px', overflow: 'hidden', maxHeight: '280px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={container.image}
                        alt="Container Banner"
                        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Inner Components in Preview */}
                  {(container.components || []).map((comp, compIdx) => {
                    // Action Row Buttons
                    if (comp.type === 1) {
                      const items = (comp.items || comp.components || []) as DiscordButtonComponent[];
                      return (
                        <div key={comp.id || compIdx} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {items.map((btn, bIdx) => {
                            const isLink = btn.style === 5;
                            const emojiDisplay = typeof btn.emoji === 'object' ? btn.emoji.name : btn.emoji;
                            const styleColors: Record<number, string> = {
                              1: '#5865F2', // Primary
                              2: '#4E5058', // Secondary
                              3: '#248046', // Success
                              4: '#DA373C', // Danger
                              5: '#4E5058'  // Link
                            };
                            return (
                              <button
                                key={btn.id || bIdx}
                                type="button"
                                style={{
                                  background: styleColors[btn.style] || '#4E5058',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '6px 14px',
                                  fontSize: '12.5px',
                                  fontWeight: 500,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: btn.disabled ? 'not-allowed' : 'pointer',
                                  opacity: btn.disabled ? 0.5 : 1
                                }}
                              >
                                {emojiDisplay && <span>{emojiDisplay}</span>}
                                <span>{btn.label || 'Button'}</span>
                                {isLink && <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }} />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    }

                    // Select Menus
                    if ([3, 5, 6, 7, 8].includes(comp.type)) {
                      const sel = comp as DiscordSelectComponent;
                      return (
                        <div
                          key={comp.id || compIdx}
                          style={{
                            background: '#1e1f22',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '4px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#949ba4',
                            fontSize: '12.5px',
                            marginTop: '4px'
                          }}
                        >
                          <span>{sel.placeholder || 'Select an option...'}</span>
                          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }} />
                        </div>
                      );
                    }

                    // Separator
                    if (comp.type === 14) {
                      const isDivider = comp.divider !== false;
                      const spacing = comp.spacing === 2 ? 14 : 8;
                      return (
                        <div
                          key={comp.id || compIdx}
                          style={{
                            margin: `${spacing}px 0`,
                            height: isDivider ? '1px' : '0px',
                            background: isDivider ? 'rgba(255,255,255,0.1)' : 'transparent'
                          }}
                        />
                      );
                    }

                    // Text Display
                    if (comp.type === 10) {
                      const text = comp.text || comp.content || '';
                      return (
                        <div key={comp.id || compIdx} style={{ fontSize: '13px', color: '#dbdee1' }}>
                          {renderDiscordMarkdown(text)}
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Footer */}
                  {container.footer?.text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#949ba4', marginTop: '4px' }}>
                      {container.footer.icon_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={container.footer.icon_url}
                          alt="Footer Icon"
                          style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <span>{container.footer.text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
