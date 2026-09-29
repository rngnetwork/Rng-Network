import React from 'react';
import { Type17Container, DiscordInnerComponent, DiscordButtonComponent } from '../../types';
import { ContainerHeader } from './ContainerHeader';
import { ContainerFields } from './ContainerFields';
import { ComponentItemRenderer } from '../components/ComponentItemRenderer';

interface ContainerCardProps {
  cIdx: number;
  totalContainers: number;
  container: Type17Container;
  isAuthorCollapsed?: boolean;
  onUpdateAccent: (cIdx: number, color: string) => void;
  onToggleSpoiler: (cIdx: number) => void;
  onToggleAuthorCollapse: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onRemoveContainer: (cIdx: number) => void;
  onUpdateAuthor: (cIdx: number, key: 'name' | 'icon_url', val: string) => void;
  onUpdateTitle: (cIdx: number, val: string) => void;
  onUpdateDescription: (cIdx: number, val: string) => void;
  onUpdateThumbnail: (cIdx: number, url: string) => void;
  onUpdateImage: (cIdx: number, url: string) => void;
  onUpdateFooter: (cIdx: number, key: 'text' | 'icon_url', val: string) => void;
  onAddField: (cIdx: number) => void;
  onUpdateField: (cIdx: number, fIdx: number, key: 'name' | 'value' | 'inline', val: string | boolean) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordInnerComponent) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onOpenButtonModal: (cIdx: number, rowId: string, bIdx: number, data: DiscordButtonComponent) => void;
  onOpenPaletteModal: (cIdx: number) => void;
  // Drag and Drop
  onContainerDragStart: (e: React.DragEvent, cIdx: number) => void;
  onContainerDragOver: (e: React.DragEvent, cIdx: number) => void;
  onContainerDrop: (e: React.DragEvent, cIdx: number) => void;
  onCompDragStart: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onCompDragOver: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onCompDrop: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  draggedComp?: { cIdx: number; compIdx: number } | null;
  dragOverComp?: { cIdx: number; compIdx: number } | null;
}

export function ContainerCard({
  cIdx,
  totalContainers,
  container,
  isAuthorCollapsed = false,
  onUpdateAccent,
  onToggleSpoiler,
  onToggleAuthorCollapse,
  onMoveContainer,
  onRemoveContainer,
  onUpdateAuthor,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateFooter,
  onAddField,
  onUpdateField,
  onRemoveField,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onOpenButtonModal,
  onContainerDragStart,
  onContainerDragOver,
  onContainerDrop,
  onCompDragStart,
  onCompDragOver,
  onCompDrop,
  draggedComp,
  dragOverComp
}: ContainerCardProps) {
  return (
    <div
      className="wysiwyg-container-card"
      onDragOver={(e) => onContainerDragOver(e, cIdx)}
      onDrop={(e) => onContainerDrop(e, cIdx)}
      style={{
        borderLeft: `4px solid ${container.accentColor || '#00A8FC'}`,
        background: '#1e1f22',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      {/* 1. Header with Controls */}
      <ContainerHeader
        cIdx={cIdx}
        totalContainers={totalContainers}
        accentColor={container.accentColor}
        isSpoiler={container.isSpoiler}
        isAuthorCollapsed={isAuthorCollapsed}
        onUpdateAccent={onUpdateAccent}
        onToggleSpoiler={onToggleSpoiler}
        onToggleAuthorCollapse={onToggleAuthorCollapse}
        onMoveContainer={onMoveContainer}
        onRemoveContainer={onRemoveContainer}
        onDragStart={onContainerDragStart}
      />

      {/* 2. Author Header (Collapsible) */}
      {!isAuthorCollapsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#191a1d', padding: '6px 10px', borderRadius: '4px' }}>
          <i className="fa-solid fa-user" style={{ fontSize: '12px', color: 'var(--discord-text-muted)' }} />
          <input
            type="text"
            className="bare-input"
            style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#fff' }}
            value={container.author?.name || ''}
            placeholder="Author Name (e.g. Server Announcements)"
            onChange={(e) => onUpdateAuthor(cIdx, 'name', e.target.value)}
          />
        </div>
      )}

      {/* 3. Title & Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          className="bare-input"
          style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}
          value={container.title || ''}
          placeholder="Container Title (e.g. Welcome & Rules)"
          onChange={(e) => onUpdateTitle(cIdx, e.target.value)}
        />
        <textarea
          className="bare-input"
          style={{ fontSize: '12px', color: '#dbdee1', minHeight: '45px', resize: 'vertical' }}
          value={container.description || ''}
          placeholder="Container Description / Body Markdown text..."
          onChange={(e) => onUpdateDescription(cIdx, e.target.value)}
        />
      </div>

      {/* 4. Custom Fields */}
      <ContainerFields
        cIdx={cIdx}
        fields={container.fields}
        onAddField={onAddField}
        onUpdateField={onUpdateField}
        onRemoveField={onRemoveField}
      />

      {/* 5. Inner Components List (Directly rendered without redundant header or duplicate button) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(container.components || []).map((comp, compIdx) => {
          const isDragging = draggedComp?.cIdx === cIdx && draggedComp?.compIdx === compIdx;
          const isDragOver = dragOverComp?.cIdx === cIdx && dragOverComp?.compIdx === compIdx;

          return (
            <ComponentItemRenderer
              key={comp.id || `${cIdx}_${compIdx}`}
              cIdx={cIdx}
              compIdx={compIdx}
              comp={comp}
              onUpdateComponent={onUpdateComponent}
              onRemoveComponent={onRemoveComponent}
              onDuplicateComponent={onDuplicateComponent}
              onOpenButtonModal={onOpenButtonModal}
              onDragStart={onCompDragStart}
              onDragOver={onCompDragOver}
              onDrop={onCompDrop}
              isDragging={isDragging}
              isDragOver={isDragOver}
            />
          );
        })}
      </div>

      {/* 6. Footer Subtext (Strictly positioned at container bottom per SS-2) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: '4px',
          padding: '6px 10px',
          marginTop: '4px'
        }}
      >
        <i className="fa-regular fa-calendar" style={{ fontSize: '13px', color: 'var(--discord-text-muted)' }} />
        <input
          type="text"
          className="bare-input"
          style={{ flex: 1, fontSize: '11.5px', color: '#dbdee1' }}
          value={container.footer?.text || ''}
          placeholder="Footer Text"
          onChange={(e) => onUpdateFooter(cIdx, 'text', e.target.value)}
        />
      </div>
    </div>
  );
}
