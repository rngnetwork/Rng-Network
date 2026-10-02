"use client";

import React from 'react';
import { Type17Container, DiscordButtonComponent, DiscordSelectComponent, DiscordMediaGalleryComponent } from '../../types';
import { renderDiscordEmoji } from '../../DiscordEmojiRenderer';

interface PreviewTabProps {
  messageContent?: string;
  containers: Type17Container[];
}

export function PreviewTab({
  messageContent,
  containers
}: PreviewTabProps) {
  // Comprehensive markdown tokenizer for live Discord preview
  const parseInlineMarkdown = (lineText: string): React.ReactNode[] => {
    if (!lineText) return [];
    const regex = /(`[^`]+`)|(\|\|[\s\S]+?\|\|)|(__\*\*(?:[\s\S]+?)\*\*__)|(\*\*__(?:[\s\S]+?)__\*\*)|(\*\*\*(?:[\s\S]+?)\*\*\*)|(\*\*(?:[\s\S]+?)\*\*)|(__(?:[\s\S]+?)__)|(~~(?:[\s\S]+?)~~)|(\*[^*]+?\*)|(_[^_]+?_)|(<a?:[a-zA-Z0-9_]+:[0-9]+>)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        elements.push(lineText.substring(lastIndex, match.index));
      }
      const token = match[0];
      const key = `${match.index}_${token}`;

      if (token.startsWith('`') && token.endsWith('`')) {
        elements.push(
          <code
            key={key}
            style={{
              background: '#1e1f22',
              padding: '1px 5px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#e0e0e0'
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('||') && token.endsWith('||')) {
        elements.push(
          <span
            key={key}
            style={{
              background: '#202225',
              color: '#dbdee1',
              padding: '1px 5px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {token.slice(2, -2)}
          </span>
        );
      } else if ((token.startsWith('__**') && token.endsWith('**__')) || (token.startsWith('**__') && token.endsWith('__**'))) {
        elements.push(
          <u key={key}>
            <strong style={{ fontWeight: 700, color: '#fff' }}>
              {token.slice(4, -4)}
            </strong>
          </u>
        );
      } else if (token.startsWith('***') && token.endsWith('***')) {
        elements.push(
          <strong key={key} style={{ fontWeight: 700, color: '#fff' }}>
            <em>{token.slice(3, -3)}</em>
          </strong>
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        elements.push(
          <strong key={key} style={{ fontWeight: 700, color: '#fff' }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('__') && token.endsWith('__')) {
        elements.push(
          <u key={key}>
            {token.slice(2, -2)}
          </u>
        );
      } else if (token.startsWith('~~') && token.endsWith('~~')) {
        elements.push(
          <s key={key} style={{ opacity: 0.75 }}>
            {token.slice(2, -2)}
          </s>
        );
      } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
        elements.push(
          <em key={key}>
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('<') && token.endsWith('>')) {
        const emojiMatch = token.match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/);
        if (emojiMatch) {
          const isAnim = emojiMatch[1] === 'a';
          const name = emojiMatch[2];
          const id = emojiMatch[3];
          const ext = isAnim ? 'gif' : 'webp';
          elements.push(
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={key}
              src={`https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`}
              alt={`:${name}:`}
              title={`:${name}:`}
              className="discord-inline-emoji"
              style={{
                display: 'inline-block',
                verticalAlign: '-0.2em',
                width: '1.375em',
                height: '1.375em',
                margin: '0 1px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('.png')) {
                  target.src = `https://cdn.discordapp.com/emojis/${id}.png?size=48`;
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          );
        } else {
          elements.push(token);
        }
      } else {
        elements.push(token);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < lineText.length) {
      elements.push(lineText.substring(lastIndex));
    }

    return elements;
  };

  const renderDiscordMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {lines.map((line, idx) => {
          let formattedLine: React.ReactNode;

          if (line.startsWith('### ')) {
            formattedLine = (
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0', color: '#fff' }}>
                {parseInlineMarkdown(line.replace('### ', ''))}
              </h3>
            );
          } else if (line.startsWith('## ')) {
            formattedLine = (
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '3px 0', color: '#fff' }}>
                {parseInlineMarkdown(line.replace('## ', ''))}
              </h2>
            );
          } else if (line.startsWith('# ')) {
            formattedLine = (
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0', color: '#fff' }}>
                {parseInlineMarkdown(line.replace('# ', ''))}
              </h1>
            );
          } else if (line.startsWith('> ')) {
            formattedLine = (
              <div style={{ borderLeft: '4px solid #4e5058', paddingLeft: '8px', color: '#dbdee1' }}>
                {parseInlineMarkdown(line.replace('> ', ''))}
              </div>
            );
          } else if (line.startsWith('-# ')) {
            formattedLine = (
              <span style={{ fontSize: '11px', color: '#949ba4' }}>
                {parseInlineMarkdown(line.replace('-# ', ''))}
              </span>
            );
          } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            formattedLine = (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ color: 'var(--discord-cyan)' }}>•</span>
                <span>{parseInlineMarkdown(line.replace(/^([•\-*]\s*)/, ''))}</span>
              </div>
            );
          } else {
            formattedLine = parseInlineMarkdown(line);
          }

          return <div key={idx}>{formattedLine}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div className="preview-board-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
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

            {/* Lead-in Message Content (Rendered as Discord Text Display) */}
            {messageContent && messageContent.trim() && (
              <div style={{ fontSize: '15px', color: '#dbdee1', lineHeight: '1.375', marginBottom: '8px', wordBreak: 'break-word' }}>
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

                  {/* Author Header (Underline & Bold) */}
                  {container.author?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'underline', color: '#fff' }}>
                        {parseInlineMarkdown(container.author.name)}
                      </span>
                    </div>
                  )}

                  {/* Title & Description with optional Thumbnail */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {container.title && (
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                          {parseInlineMarkdown(container.title)}
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
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{parseInlineMarkdown(f.name)}</span>
                          <span style={{ fontSize: '12px', color: '#dbdee1' }}>{renderDiscordMarkdown(f.value)}</span>
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
                                {renderDiscordEmoji(btn.emoji, 18)}
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
                          <span>{parseInlineMarkdown(sel.placeholder || 'Select an option...')}</span>
                          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }} />
                        </div>
                      );
                    }

                    // Separator (Type 14)
                    if (comp.type === 14) {
                      const isDivider = comp.divider !== false;
                      const marginY = comp.spacing === 2 ? 12 : 6;
                      return (
                        <div
                          key={comp.id || compIdx}
                          style={{
                            margin: `${marginY}px 0`,
                            height: isDivider ? '1px' : '0px',
                            background: isDivider ? 'rgba(255,255,255,0.12)' : 'transparent',
                            width: '100%'
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
                    // Section (Type 9)
                    if (comp.type === 9) {
                      const text = comp.text || (comp.components && comp.components[0]?.content) || '';
                      const acc = comp.accessory;
                      const accessoryUrl = acc && 'media' in acc && acc.media?.url ? acc.media.url : (acc && 'url' in acc && typeof acc.url === 'string' ? acc.url : '');
                      return (
                        <div
                          key={comp.id || compIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginTop: '4px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, fontSize: '13.5px', color: '#dbdee1', lineHeight: '1.4' }}>
                            {renderDiscordMarkdown(text)}
                          </div>
                          {accessoryUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={accessoryUrl}
                              alt="Section Thumbnail"
                              style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                      );
                    }

                    // Media Gallery (Type 12)
                    if (comp.type === 12) {
                      const gallery = comp as DiscordMediaGalleryComponent;
                      const rawItems = gallery.items || [];
                      const urls = rawItems
                        .map((item) => (typeof item === 'string' ? item : item?.media?.url || ''))
                        .filter(Boolean);

                      if (urls.length === 0) return null;

                      const gridCols =
                        urls.length === 1
                          ? '1fr'
                          : urls.length === 2
                          ? '1fr 1fr'
                          : 'repeat(auto-fit, minmax(130px, 1fr))';

                      return (
                        <div
                          key={comp.id || compIdx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: gridCols,
                            gap: '4px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginTop: '6px',
                            maxHeight: '300px'
                          }}
                        >
                          {urls.map((url, uIdx) => (
                            <div
                              key={uIdx}
                              style={{
                                background: '#1e1f22',
                                minHeight: urls.length === 1 ? '160px' : '100px',
                                maxHeight: '220px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Gallery item ${uIdx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Footer */}
                  {container.footer?.text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#949ba4', marginTop: '4px' }}>
                      <span>{parseInlineMarkdown(container.footer.text)}</span>
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
