import React, { useRef, useEffect } from 'react';
import { Type17Container, DiscordInnerComponent, DiscordButtonComponent } from '../../types';
import { ContainerCard } from '../containers/ContainerCard';
import { EmojiItem } from '../../emoji-data';

interface EditTabProps {
  messageContent?: string;
  setMessageContent?: React.Dispatch<React.SetStateAction<string>>;
  containers: Type17Container[];
  setContainers: React.Dispatch<React.SetStateAction<Type17Container[]>>;
  onOpenEmojiPicker: (
    e: React.MouseEvent<HTMLButtonElement>,
    onSelect: (emoji: EmojiItem, insertStr: string) => void
  ) => void;
  onOpenPaletteModal: (cIdx: number) => void;
  onOpenButtonModal: (cIdx: number, rowId: string, bIdx: number, data: DiscordButtonComponent) => void;
  onOpenLoadModal?: () => void;
  onDirtyChange?: () => void;
  // Drag and Drop
  draggedComp: { cIdx: number; compIdx: number } | null;
  setDraggedComp: React.Dispatch<React.SetStateAction<{ cIdx: number; compIdx: number } | null>>;
  dragOverComp: { cIdx: number; compIdx: number } | null;
  setDragOverComp: React.Dispatch<React.SetStateAction<{ cIdx: number; compIdx: number } | null>>;
  draggedContainer: number | null;
  setDraggedContainer: React.Dispatch<React.SetStateAction<number | null>>;
  collapsedAuthors: Record<number, boolean>;
  setCollapsedAuthors: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  serverId?: string;
}

export function EditTab({
  containers,
  setContainers,
  onOpenEmojiPicker,
  onOpenPaletteModal,
  onOpenButtonModal,
  onOpenLoadModal,
  onDirtyChange,
  draggedComp,
  setDraggedComp,
  dragOverComp,
  setDragOverComp,
  draggedContainer,
  setDraggedContainer,
  collapsedAuthors,
  setCollapsedAuthors,
  serverId
}: EditTabProps) {
  // Active text input tracking for cursor-aware emoji insertion
  const lastActiveInputRef = useRef<{
    element: HTMLInputElement | HTMLTextAreaElement;
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (!el.classList.contains('emoji-search-input') && !el.closest('.discord-emoji-picker-popover')) {
          lastActiveInputRef.current = {
            element: el,
            start: el.selectionStart ?? el.value.length,
            end: el.selectionEnd ?? el.value.length
          };
        }
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('focusin', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('mouseup', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('focusin', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  const insertEmojiAtCursor = (_emoji: EmojiItem, insertStr: string) => {
    const target = lastActiveInputRef.current;
    if (target && document.body.contains(target.element)) {
      const el = target.element;
      const start = target.start ?? el.value.length;
      const end = target.end ?? el.value.length;
      const val = el.value;
      const updated = val.slice(0, start) + insertStr + val.slice(end);

      const nativeSetter = el instanceof HTMLTextAreaElement
        ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(el, updated);
      } else {
        el.value = updated;
      }

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      const nextPos = start + insertStr.length;
      lastActiveInputRef.current = { element: el, start: nextPos, end: nextPos };

      setTimeout(() => {
        try {
          el.focus();
          el.setSelectionRange(nextPos, nextPos);
        } catch {
          // ignore focus error
        }
      }, 10);
    }
  };

  // Container Operations
  const handleAddContainer = () => {
    const newContainer: Type17Container = {
      id: `c17_${Date.now()}`,
      accentColor: '#00A8FC',
      isSpoiler: false,
      author: { name: '', icon_url: '' },
      title: '',
      description: '',
      fields: [],
      thumbnail: '',
      image: '',
      footer: { text: '', icon_url: '' },
      components: []
    };
    setContainers([...containers, newContainer]);
    onDirtyChange?.();
  };

  const handleRemoveContainer = (cIdx: number) => {
    if (containers.length <= 1) {
      if (!confirm('Remove this container? You can always add a new one.')) return;
    }
    const updated = [...containers];
    updated.splice(cIdx, 1);
    setContainers(updated);
    onDirtyChange?.();
  };

  const handleMoveContainer = (cIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? cIdx - 1 : cIdx + 1;
    if (targetIdx < 0 || targetIdx >= containers.length) return;
    const updated = [...containers];
    const [moved] = updated.splice(cIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setContainers(updated);
    onDirtyChange?.();
  };

  const handleUpdateAccent = (cIdx: number, color: string) => {
    const upd = [...containers];
    upd[cIdx].accentColor = color;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleToggleSpoiler = (cIdx: number) => {
    const upd = [...containers];
    upd[cIdx].isSpoiler = !upd[cIdx].isSpoiler;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleToggleAuthorCollapse = (cIdx: number) => {
    setCollapsedAuthors((prev) => ({
      ...prev,
      [cIdx]: !prev[cIdx]
    }));
  };

  const handleUpdateAuthor = (cIdx: number, key: 'name' | 'icon_url', val: string) => {
    const upd = [...containers];
    if (!upd[cIdx].author) upd[cIdx].author = { name: '', icon_url: '' };
    upd[cIdx].author![key] = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateTitle = (cIdx: number, val: string) => {
    const upd = [...containers];
    upd[cIdx].title = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateDescription = (cIdx: number, val: string) => {
    const upd = [...containers];
    upd[cIdx].description = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateThumbnail = (cIdx: number, url: string) => {
    const upd = [...containers];
    upd[cIdx].thumbnail = url;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateImage = (cIdx: number, url: string) => {
    const upd = [...containers];
    upd[cIdx].image = url;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateFooter = (cIdx: number, key: 'text' | 'icon_url', val: string) => {
    const upd = [...containers];
    if (!upd[cIdx].footer) upd[cIdx].footer = { text: '', icon_url: '' };
    upd[cIdx].footer![key] = val;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleAddField = (cIdx: number) => {
    const upd = [...containers];
    if (!upd[cIdx].fields) upd[cIdx].fields = [];
    upd[cIdx].fields!.push({
      id: `field_${Date.now()}`,
      name: `Field ${(upd[cIdx].fields?.length || 0) + 1}`,
      value: 'Field value',
      inline: true
    });
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleUpdateField = (cIdx: number, fIdx: number, key: 'name' | 'value' | 'inline', val: string | boolean) => {
    const upd = [...containers];
    const targetFields = upd[cIdx].fields;
    if (targetFields && targetFields[fIdx]) {
      if (key === 'inline') {
        targetFields[fIdx].inline = Boolean(val);
      } else {
        targetFields[fIdx][key] = String(val);
      }
      setContainers(upd);
      onDirtyChange?.();
    }
  };

  const handleRemoveField = (cIdx: number, fIdx: number) => {
    const upd = [...containers];
    if (upd[cIdx].fields) {
      upd[cIdx].fields!.splice(fIdx, 1);
      setContainers(upd);
      onDirtyChange?.();
    }
  };

  const handleUpdateComponent = (cIdx: number, compIdx: number, updated: DiscordInnerComponent) => {
    const upd = [...containers];
    upd[cIdx].components[compIdx] = updated;
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleRemoveComponent = (cIdx: number, compIdx: number) => {
    const upd = [...containers];
    upd[cIdx].components.splice(compIdx, 1);
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleDuplicateComponent = (cIdx: number, compIdx: number) => {
    const upd = [...containers];
    const clone = JSON.parse(JSON.stringify(upd[cIdx].components[compIdx]));
    clone.id = `comp_${Date.now()}`;
    upd[cIdx].components.splice(compIdx + 1, 0, clone);
    setContainers(upd);
    onDirtyChange?.();
  };

  const handleAddActionRow = (cIdx = 0) => {
    if (containers.length === 0) handleAddContainer();
    const updated = [...containers];
    const target = updated[cIdx] || updated[0];
    target.components.push({
      type: 1,
      id: `row_${Date.now()}`,
      label: `ROW ${target.components.filter((c) => c.type === 1).length + 1}`,
      items: [
        { type: 2, style: 1, label: 'Action Button', custom_id: `btn_${Date.now()}` }
      ]
    });
    setContainers(updated);
    onDirtyChange?.();
  };

  const handleClearCanvas = () => {
    if (!confirm('Clear all containers and reset message?')) return;
    setContainers([]);
    onDirtyChange?.();
  };

  // Drag and Drop handlers
  const handleContainerDragStart = (e: React.DragEvent, cIdx: number) => {
    setDraggedContainer(cIdx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleContainerDrop = (e: React.DragEvent, targetCIdx: number) => {
    e.preventDefault();
    if (draggedContainer === null || draggedContainer === targetCIdx) return;
    const updated = [...containers];
    const [moved] = updated.splice(draggedContainer, 1);
    updated.splice(targetCIdx, 0, moved);
    setContainers(updated);
    setDraggedContainer(null);
    onDirtyChange?.();
  };

  const handleCompDragStart = (e: React.DragEvent, cIdx: number, compIdx: number) => {
    setDraggedComp({ cIdx, compIdx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCompDragOver = (e: React.DragEvent, cIdx: number, compIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverComp || dragOverComp.cIdx !== cIdx || dragOverComp.compIdx !== compIdx) {
      setDragOverComp({ cIdx, compIdx });
    }
  };

  const handleCompDrop = (e: React.DragEvent, targetCIdx: number, targetCompIdx: number) => {
    e.preventDefault();
    if (!draggedComp) return;
    const { cIdx: srcCIdx, compIdx: srcCompIdx } = draggedComp;

    if (srcCIdx === targetCIdx && srcCompIdx === targetCompIdx) {
      setDraggedComp(null);
      setDragOverComp(null);
      return;
    }

    const updated = [...containers];
    const [moved] = updated[srcCIdx].components.splice(srcCompIdx, 1);
    updated[targetCIdx].components.splice(targetCompIdx, 0, moved);
    setContainers(updated);
    setDraggedComp(null);
    setDragOverComp(null);
    onDirtyChange?.();
  };

  return (
    <div className="tab-content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: 0 }}>
      {/* Scrollable Canvas Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 0 }}>
        <div className="wysiwyg-canvas-wrapper" style={{ minHeight: 'auto' }}>
          <div className="wysiwyg-board" style={{ borderRadius: 'var(--radius-md)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Type 17 Containers List */}
            <div id="wysiwyg-containers-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {containers.map((container, cIdx) => (
                <ContainerCard
                  key={container.id || cIdx}
                  cIdx={cIdx}
                  totalContainers={containers.length}
                  container={container}
                  isAuthorCollapsed={Boolean(collapsedAuthors[cIdx])}
                  onUpdateAccent={handleUpdateAccent}
                  onToggleSpoiler={handleToggleSpoiler}
                  onToggleAuthorCollapse={handleToggleAuthorCollapse}
                  onMoveContainer={handleMoveContainer}
                  onRemoveContainer={handleRemoveContainer}
                  onUpdateAuthor={handleUpdateAuthor}
                  onUpdateTitle={handleUpdateTitle}
                  onUpdateDescription={handleUpdateDescription}
                  onUpdateThumbnail={handleUpdateThumbnail}
                  onUpdateImage={handleUpdateImage}
                  onUpdateFooter={handleUpdateFooter}
                  onAddField={handleAddField}
                  onUpdateField={handleUpdateField}
                  onRemoveField={handleRemoveField}
                  onUpdateComponent={handleUpdateComponent}
                  onRemoveComponent={handleRemoveComponent}
                  onDuplicateComponent={handleDuplicateComponent}
                  onOpenButtonModal={onOpenButtonModal}
                  onOpenPaletteModal={onOpenPaletteModal}
                  onContainerDragStart={handleContainerDragStart}
                  onContainerDragOver={handleContainerDragOver}
                  onContainerDrop={handleContainerDrop}
                  onCompDragStart={handleCompDragStart}
                  onCompDragOver={handleCompDragOver}
                  onCompDrop={handleCompDrop}
                  draggedComp={draggedComp}
                  dragOverComp={dragOverComp}
                  serverId={serverId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Permanently Docked Bottom Controls Bar */}
      <div className="wysiwyg-bottom-bar" style={{ flexShrink: 0, position: 'relative', bottom: 0, zIndex: 30, width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <button
          type="button"
          className="btn-ctrl-cyan"
          onClick={handleAddContainer}
          title="Add another Type 17 Container"
        >
          <i className="fa-solid fa-plus" /> Container
        </button>
        <button
          type="button"
          className="btn-ctrl-blue"
          onClick={() => handleAddActionRow(0)}
          title="Add Action Row"
        >
          <i className="fa-solid fa-plus" /> Action Row
        </button>
        <button
          type="button"
          className="btn-ctrl-purple"
          onClick={() => onOpenPaletteModal(0)}
          title="Insert Discord Component Types"
        >
          <i className="fa-solid fa-cubes" /> + UI Components
        </button>
        <button
          type="button"
          className="btn-ctrl-green"
          onClick={onOpenLoadModal}
          title="Load Template or Preset"
        >
          <i className="fa-solid fa-folder-open" /> Load
        </button>
        <button
          type="button"
          className="btn-ctrl-red"
          onClick={handleClearCanvas}
          title="Clear Builder"
        >
          Clear
        </button>
        <button
          type="button"
          className="btn-ctrl-emoji"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={(e) => {
            onOpenEmojiPicker(e, insertEmojiAtCursor);
          }}
          title="Open Discord Emoji Picker"
        >
          <i className="fa-regular fa-face-smile" />
        </button>
      </div>
    </div>
  );
}
