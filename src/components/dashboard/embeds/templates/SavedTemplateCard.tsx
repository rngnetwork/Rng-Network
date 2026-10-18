'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  Trash2,
  ArrowUpRight,
  Bookmark,
  Copy,
  Check,
  Download,
  Pencil,
} from 'lucide-react';
import type { TemplateData } from '@/lib/model/embed';
import { Badge } from '@/components/common/feedback/Badge';
import { Button } from '@/components/common/input/Button';

export interface SavedTemplateCardProps {
  template?: TemplateData;
  onLoadTemplate: (template: TemplateData) => void;
  onEditTemplate?: (template: TemplateData) => void;
  onExportTemplate?: (template: TemplateData) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onCreateFirstTemplate?: () => void;
}

export const SavedTemplateCard: React.FC<SavedTemplateCardProps> = ({
  template,
  onLoadTemplate,
  onEditTemplate,
  onExportTemplate,
  onDeleteTemplate,
  onCreateFirstTemplate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!template) {
    return (
      <div className="p-10 rounded-apple-xl bg-surface-card border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
        <div className="p-3 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red">
          <Bookmark size={22} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">
            No Saved Templates
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mt-1">
            Save your current layout for reusable dispatches and action replies.
          </p>
        </div>
        {onCreateFirstTemplate && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onCreateFirstTemplate}
          >
            Save Layout as Template
          </Button>
        )}
      </div>
    );
  }

  const rawPayload = (template.payload || template.payloadJson || {}) as Record<string, unknown>;
  const containersList = Array.isArray(rawPayload.containers)
    ? rawPayload.containers
    : Array.isArray(rawPayload.components)
    ? rawPayload.components
    : Array.isArray(template.components)
    ? template.components
    : [];
  const containerCount = containersList.length;

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(template.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen size={16} className="text-brand-red shrink-0" />
            <h4 className="text-sm font-bold text-white truncate">
              {template.name}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="neutral" size="sm">
              {template.category || 'GENERAL'}
            </Badge>
          </div>
        </div>

        {/* Copyable Template ID chip */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-apple-md bg-black/40 border border-white/[0.06]">
          <span className="font-mono text-[11px] text-zinc-400 truncate select-all">
            {template.id}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy Template ID"
            aria-label="Copy Template ID"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2">
          {template.description || 'Reusable Discord Components V2 template.'}
        </p>

        {Array.isArray(template.tags) && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-zinc-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-zinc-500">
          v{template.version ?? 1} · {containerCount} container{containerCount !== 1 ? 's' : ''} · {template.public || template.isPublic ? 'Public' : 'Private'}
        </span>

        <div className="flex items-center gap-1.5">
          {onExportTemplate && (
            <button
              type="button"
              onClick={() => onExportTemplate(template)}
              title="Export as JSON"
              aria-label={`Export ${template.name} as JSON`}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Download size={14} />
            </button>
          )}

          {onEditTemplate && (
            <button
              type="button"
              onClick={() => onEditTemplate(template)}
              title="Edit Template"
              aria-label={`Edit template ${template.name}`}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Pencil size={14} />
            </button>
          )}

          {onDeleteTemplate && (
            <button
              type="button"
              onClick={() => onDeleteTemplate(template.id)}
              aria-label={`Delete template ${template.name}`}
              title="Delete Template"
              className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            rightIcon={<ArrowUpRight size={13} />}
            onClick={() => onLoadTemplate(template)}
          >
            Load Layout
          </Button>
        </div>
      </div>
    </div>
  );
};
