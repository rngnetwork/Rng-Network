'use client';

import React, { useState, useMemo } from 'react';
import { LayoutTemplate, Search, ArrowRight, FolderOpen } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import type { Type17Container, TemplateData, DiscordInnerComponent } from '@/lib/model/embed';
import { parseDiscordPayloadToState } from '../useEmbedBuilderReducer';

export interface LoadPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTemplates: TemplateData[];
  onLoadTemplate: (
    state: { message: { content: string }; type17Containers: Type17Container[] },
    name?: string
  ) => void;
  onInsertComponent?: (comp: DiscordInnerComponent) => void;
}

export const LoadPresetModal: React.FC<LoadPresetModalProps> = ({
  isOpen,
  onClose,
  savedTemplates,
  onLoadTemplate,
}) => {
  const [search, setSearch] = useState('');

  const filteredSaved = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return savedTemplates;
    return savedTemplates.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [search, savedTemplates]);

  const handleSelectTemplate = (tpl: TemplateData) => {
    const p = (tpl.payload || tpl.payloadJson || {}) as Record<string, unknown>;
    let containers: Type17Container[] = [];
    let content = '';

    if (Array.isArray(p.containers)) {
      containers = p.containers as Type17Container[];
      content = String(p.content || p.builderContent || '');
    } else if (Array.isArray(p.components)) {
      try {
        const parsed = parseDiscordPayloadToState(p);
        containers = parsed.type17Containers || [];
        content = parsed.message?.content || '';
      } catch {
        containers = [];
      }
    }

    onLoadTemplate(
      {
        message: { content },
        type17Containers: containers,
      },
      tpl.name
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Template"
      description="Select a saved template to restore to your canvas."
      size="md"
    >
      <div className="flex flex-col gap-3">
        {/* Sleek Search Input (only shown when user has more than 3 templates) */}
        {savedTemplates.length > 3 && (
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-apple-md bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        )}

        {/* Clean Single-Column List */}
        <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-0.5">
          {filteredSaved.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <FolderOpen size={24} className="text-zinc-600" />
              <span className="text-xs font-medium text-zinc-400">
                {search.trim() ? 'No matching templates found' : 'No saved templates yet'}
              </span>
              <p className="text-[11px] text-zinc-600 max-w-[240px]">
                {search.trim()
                  ? 'Try a different search term.'
                  : 'Save your current canvas using the Save button in the bottom dock.'}
              </p>
            </div>
          ) : (
            filteredSaved.map((tpl) => {
              const formattedDate = tpl.updatedAt || tpl.createdAt
                ? new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : undefined;

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="group flex items-center justify-between gap-3 p-3 rounded-apple-lg bg-surface-card hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-apple-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                      <LayoutTemplate size={15} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {tpl.name}
                      </span>
                      {tpl.description ? (
                        <span className="text-[11px] text-zinc-400 truncate">
                          {tpl.description}
                        </span>
                      ) : formattedDate ? (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Saved {formattedDate}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(tpl);
                    }}
                    className="shrink-0 px-3 py-1 rounded-apple-md bg-white/10 hover:bg-brand-red text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    Load
                    <ArrowRight size={12} className="opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
