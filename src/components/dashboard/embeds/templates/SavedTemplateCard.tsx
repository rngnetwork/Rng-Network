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
import { Button } from '@/components/common/input/Button';

export interface SavedTemplateCardProps {
  template?: TemplateData;
  serversMap?: Record<string, string>;
  onLoadTemplate: (template: TemplateData) => void;
  onEditTemplate?: (template: TemplateData) => void;
  onExportTemplate?: (template: TemplateData) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onCreateFirstTemplate?: () => void;
}

export const SavedTemplateCard: React.FC<SavedTemplateCardProps> = ({
  template,
  serversMap = {},
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

  const isGlobal = Boolean(template.public ?? template.isPublic ?? true);
  const rawTemplate = template as unknown as {
    serverIds?: string[];
    serverId?: string;
    tags?: string[];
  };
  const assignedServers: string[] =
    Array.isArray(rawTemplate.serverIds) && rawTemplate.serverIds.length > 0
      ? rawTemplate.serverIds
      : rawTemplate.serverId
      ? [rawTemplate.serverId]
      : Array.isArray(rawTemplate.tags) && !isGlobal && rawTemplate.tags.length > 0
      ? rawTemplate.tags
      : [];

  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] hover:border-white/15 transition-all flex flex-col justify-between gap-4 shadow-apple-card">
      <div className="flex flex-col gap-2">
        {/* Header: Name + Real Category Pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen size={16} className="text-brand-red shrink-0" />
            <h4 className="text-sm font-bold text-white truncate">
              {template.name}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
              {(template.category || 'general').toLowerCase()}
            </span>
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

        {/* Description: Only shown if non-empty */}
        {template.description?.trim() ? (
          <p className="text-xs text-zinc-400 line-clamp-2">
            {template.description}
          </p>
        ) : null}
      </div>

      {/* Footer: Scope Pills on Left + Colored Action Buttons on Right */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        {/* Scope Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isGlobal ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
              Global
            </span>
          ) : assignedServers.length > 0 ? (
            assignedServers.map((sid) => (
              <span
                key={sid}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300"
              >
                {serversMap[sid] || sid}
              </span>
            ))
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.05] border border-white/10 text-zinc-300">
              Server-Specific
            </span>
          )}
        </div>

        {/* Colored Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onExportTemplate && (
            <button
              type="button"
              onClick={() => onExportTemplate(template)}
              title="Export as JSON"
              aria-label={`Export ${template.name} as JSON`}
              className="p-1.5 rounded-apple-md text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-apple-md text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
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
              className="p-1.5 rounded-apple-md text-white bg-red-600 hover:bg-red-500 border border-red-400/30 shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onLoadTemplate(template)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-apple-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Load Layout</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
