'use client';

import React, { useState, useMemo } from 'react';
import { FolderOpen } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import { Badge } from '@/components/common/feedback/Badge';
import { TextInput } from '@/components/common/input/TextInput';
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
    return savedTemplates.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false) ||
        (s.category?.toLowerCase().includes(q) ?? false)
    );
  }, [search, savedTemplates]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Saved Template"
      description="Select a saved template to load into your message canvas."
      size="lg"
    >
      <div className="flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto pr-1">
        <TextInput
          placeholder="Search saved templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSaved.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
              <FolderOpen size={28} className="text-zinc-600" />
              <span className="font-medium text-zinc-300">No saved templates found</span>
              <p className="text-[11px] text-zinc-500 max-w-xs">
                {search.trim()
                  ? 'No templates match your search query.'
                  : 'Save your current canvas as a template to access it here anytime.'}
              </p>
            </div>
          ) : (
            filteredSaved.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-apple-lg bg-surface-card border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-apple-card"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate" title={tpl.name}>
                      {tpl.name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {tpl.category || 'General'}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {tpl.description || 'No description provided'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-mono text-zinc-500">
                    v{tpl.version} • {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
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
                    }}
                    className="px-3 py-1 rounded-apple-md bg-brand-red hover:bg-brand-red-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Load into Canvas
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
