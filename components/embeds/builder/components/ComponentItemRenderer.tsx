import React, { useState } from 'react';
import {
  DiscordInnerComponent,
  DiscordActionRowComponent,
  DiscordSelectComponent,
  DiscordSectionComponent,
  DiscordTextDisplayComponent,
  DiscordSeparatorComponent,
  DiscordMediaGalleryComponent,
  DiscordFileComponent,
  DiscordButtonComponent
} from '../../types';
import { ActionRowEditor } from './ActionRowEditor';
import { SelectMenuEditor } from './SelectMenuEditor';
import { SectionEditor } from './SectionEditor';
import { TextDisplayEditor } from './TextDisplayEditor';
import { SeparatorEditor } from './SeparatorEditor';
import { MediaGalleryEditor } from './MediaGalleryEditor';
import { FileAttachmentEditor } from './FileAttachmentEditor';
import { ModalComponentsEditor } from './ModalComponentsEditor';
import { SectionSettingsModal } from './modals/SectionSettingsModal';
import { SeparatorSettingsModal } from './modals/SeparatorSettingsModal';
import { MediaGallerySettingsModal } from './modals/MediaGallerySettingsModal';
import { SelectMenuSettingsModal } from './modals/SelectMenuSettingsModal';

interface ComponentItemRendererProps {
  cIdx: number;
  compIdx: number;
  comp: DiscordInnerComponent;
  onUpdateComponent: (cIdx: number, compIdx: number, updated: DiscordInnerComponent) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onOpenButtonModal: (cIdx: number, rowId: string, bIdx: number, data: DiscordButtonComponent) => void;
  onDragStart: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onDragOver: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  onDrop: (e: React.DragEvent, cIdx: number, compIdx: number) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const TYPE_NAMES: Record<number, string> = {
  1: 'Action Row',
  2: 'Button',
  3: 'String Select',
  4: 'Text Input',
  5: 'User Select',
  6: 'Role Select',
  7: 'Mentionable Select',
  8: 'Channel Select',
  9: 'Section',
  10: 'Text Display',
  11: 'Thumbnail Accessory',
  12: 'Media Gallery',
  13: 'File Attachment',
  14: 'Separator',
  17: 'Container',
  18: 'Label',
  19: 'File Upload',
  21: 'Radio Group',
  22: 'Checkbox Group',
  23: 'Checkbox'
};

export function ComponentItemRenderer({
  cIdx,
  compIdx,
  comp,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onOpenButtonModal,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  isDragOver = false
}: ComponentItemRendererProps) {
  const [isSectionSettingsOpen, setIsSectionSettingsOpen] = useState(false);
  const [isSeparatorSettingsOpen, setIsSeparatorSettingsOpen] = useState(false);
  const [isMediaGallerySettingsOpen, setIsMediaGallerySettingsOpen] = useState(false);
  const [isSelectSettingsOpen, setIsSelectSettingsOpen] = useState(false);
  const typeName = TYPE_NAMES[comp.type] || `Type ${comp.type}`;
  const isModalOnly = [4, 18, 19, 21, 22, 23].includes(comp.type);

  return (
    <div
      className={`draggable-comp-item ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => onDragOver(e, cIdx, compIdx)}
      onDrop={(e) => onDrop(e, cIdx, compIdx)}
      style={{
        background: '#141417',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative'
      }}
    >
      {/* Component Item Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="comp-drag-handle"
            draggable
            onDragStart={(e) => onDragStart(e, cIdx, compIdx)}
            title="Drag to reorder component"
            style={{ cursor: 'grab', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}
          >
            <i className="fa-solid fa-grip-vertical" style={{ fontSize: '11px' }} />
          </div>
          <span
            className="type-number-pill"
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isModalOnly ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 168, 252, 0.15)',
              color: isModalOnly ? '#fbbf24' : 'var(--discord-cyan)',
              border: `1px solid ${isModalOnly ? 'rgba(251, 191, 36, 0.3)' : 'rgba(0, 168, 252, 0.3)'}`
            }}
          >
            Type {comp.type} &bull; {typeName}
          </span>
          {isModalOnly && (
            <span style={{ fontSize: '9.5px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              (Modal Only)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {comp.type === 9 && (
            <button
              type="button"
              className="comp-tool-btn"
              onClick={() => setIsSectionSettingsOpen(true)}
              title="Section Settings"
              style={{ width: '22px', height: '22px', fontSize: '11px' }}
            >
              <i className="fa-solid fa-gear" />
            </button>
          )}
          {comp.type === 14 && (
            <button
              type="button"
              className="comp-tool-btn"
              onClick={() => setIsSeparatorSettingsOpen(true)}
              title="Separator Settings"
              style={{ width: '22px', height: '22px', fontSize: '11px' }}
            >
              <i className="fa-solid fa-gear" />
            </button>
          )}
          {comp.type === 12 && (
            <button
              type="button"
              className="comp-tool-btn"
              onClick={() => setIsMediaGallerySettingsOpen(true)}
              title="Media Gallery Settings"
              style={{ width: '22px', height: '22px', fontSize: '11px' }}
            >
              <i className="fa-solid fa-gear" />
            </button>
          )}
          {[3, 5, 6, 7, 8].includes(comp.type) && (
            <button
              type="button"
              className="comp-tool-btn"
              onClick={() => setIsSelectSettingsOpen(true)}
              title="Select Menu Settings"
              style={{ width: '22px', height: '22px', fontSize: '11px' }}
            >
              <i className="fa-solid fa-gear" />
            </button>
          )}
          <button
            type="button"
            className="comp-tool-btn"
            onClick={() => onDuplicateComponent(cIdx, compIdx)}
            title="Duplicate Component"
            style={{ width: '22px', height: '22px', fontSize: '11px' }}
          >
            <i className="fa-regular fa-copy" />
          </button>
          <button
            type="button"
            className="comp-tool-btn btn-del"
            onClick={() => onRemoveComponent(cIdx, compIdx)}
            title="Remove Component"
            style={{ width: '22px', height: '22px', fontSize: '11px' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      {/* Component Body Dispatcher */}
      <div>
        {comp.type === 1 && (
          <ActionRowEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordActionRowComponent}
            onUpdateComponent={onUpdateComponent as any}
            onOpenButtonModal={onOpenButtonModal}
          />
        )}
        {[3, 5, 6, 7, 8].includes(comp.type) && (
          <SelectMenuEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordSelectComponent}
            onUpdateComponent={onUpdateComponent as any}
            onOpenSettings={() => setIsSelectSettingsOpen(true)}
          />
        )}
        {comp.type === 9 && (
          <SectionEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordSectionComponent}
            onUpdateComponent={onUpdateComponent as any}
          />
        )}
        {comp.type === 10 && (
          <TextDisplayEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordTextDisplayComponent}
            onUpdateComponent={onUpdateComponent as any}
          />
        )}
        {comp.type === 14 && (
          <SeparatorEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordSeparatorComponent}
            onUpdateComponent={onUpdateComponent as any}
            onOpenSettings={() => setIsSeparatorSettingsOpen(true)}
          />
        )}
        {comp.type === 12 && (
          <MediaGalleryEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordMediaGalleryComponent}
            onUpdateComponent={onUpdateComponent as any}
            onOpenSettings={() => setIsMediaGallerySettingsOpen(true)}
          />
        )}
        {comp.type === 13 && (
          <FileAttachmentEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp as DiscordFileComponent}
            onUpdateComponent={onUpdateComponent as any}
          />
        )}
        {isModalOnly && (
          <ModalComponentsEditor
            cIdx={cIdx}
            compIdx={compIdx}
            comp={comp}
            onUpdateComponent={onUpdateComponent}
          />
        )}
      </div>

      {comp.type === 9 && (
        <SectionSettingsModal
          isOpen={isSectionSettingsOpen}
          onClose={() => setIsSectionSettingsOpen(false)}
          comp={comp as DiscordSectionComponent}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}

      {comp.type === 14 && (
        <SeparatorSettingsModal
          isOpen={isSeparatorSettingsOpen}
          onClose={() => setIsSeparatorSettingsOpen(false)}
          comp={comp as DiscordSeparatorComponent}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}

      {comp.type === 12 && (
        <MediaGallerySettingsModal
          isOpen={isMediaGallerySettingsOpen}
          onClose={() => setIsMediaGallerySettingsOpen(false)}
          comp={comp as DiscordMediaGalleryComponent}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}

      {[3, 5, 6, 7, 8].includes(comp.type) && (
        <SelectMenuSettingsModal
          isOpen={isSelectSettingsOpen}
          onClose={() => setIsSelectSettingsOpen(false)}
          comp={comp as DiscordSelectComponent}
          onSave={(updated) => onUpdateComponent(cIdx, compIdx, updated)}
        />
      )}
    </div>
  );
}
