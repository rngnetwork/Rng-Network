"use client";

import React from 'react';
import { DiscordFileComponent } from '../../types';

interface FileAttachmentEditorProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordFileComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordFileComponent) => void;
}

export function FileAttachmentEditor({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent
}: FileAttachmentEditorProps) {
  const filename = comp.filename || 'report.pdf';
  const filesize = comp.filesize || '1.2 MB';
  const fileUrl = comp.url || (comp.file && comp.file.url) || `attachment://${filename}`;

  const handleUpdate = (patch: Partial<DiscordFileComponent>) => {
    onUpdateComponent(cIdx, compIdx, { ...comp, ...patch });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#1e1f22', padding: '6px 10px', borderRadius: '4px' }}>
      <div>
        <label style={{ fontSize: '10px', color: 'var(--discord-text-muted)' }}>Filename</label>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11.5px', color: '#fff' }}
          value={filename}
          placeholder="attachment-name.pdf"
          onChange={(e) => handleUpdate({ filename: e.target.value })}
        />
      </div>
      <div>
        <label style={{ fontSize: '10px', color: 'var(--discord-text-muted)' }}>File Size</label>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11.5px', color: '#fff' }}
          value={filesize}
          placeholder="e.g. 500 KB"
          onChange={(e) => handleUpdate({ filesize: e.target.value })}
        />
      </div>
      <div>
        <label style={{ fontSize: '10px', color: 'var(--discord-text-muted)' }}>URL (attachment://)</label>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '11.5px', color: '#fff' }}
          value={fileUrl}
          placeholder="attachment://report.pdf"
          onChange={(e) => handleUpdate({ url: e.target.value })}
        />
      </div>
    </div>
  );
}
