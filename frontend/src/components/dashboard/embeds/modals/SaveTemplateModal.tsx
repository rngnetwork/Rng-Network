'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Server as ServerIcon } from 'lucide-react';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Button } from '@/components/common/input/Button';
import { fetchServers } from '@/lib/api/dashboard/servers';
import type { ServerItem } from '@/lib/model/server';

export interface SaveTemplateModalProps {
  isOpen: boolean;
  initialName?: string;
  serverId?: string;
  onClose: () => void;
  onSave: (metadata: {
    name: string;
    category: string;
    description: string;
    isPublic: boolean;
    serverId?: string;
    serverIds?: string[];
    tags?: string[];
  }) => Promise<void> | void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  initialName = '',
  serverId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(!serverId);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(serverId ? [serverId] : []);
  const [connectedServers, setConnectedServers] = useState<ServerItem[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setName(initialName);
    setCategory('');
    setDescription('');
    setIsGlobal(!serverId);
    setSelectedServerIds(serverId ? [serverId] : []);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchServers()
      .then((res) => {
        if (active && res.success && Array.isArray(res.data)) {
          setConnectedServers(res.data);
          if (serverId) {
            const matched = res.data.find((s) => s.slug === serverId || s.id === serverId);
            if (matched) {
              setSelectedServerIds((prev) => Array.from(new Set([...prev.filter((id) => id !== serverId), matched.id])));
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingServers(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleToggleServer = (id: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setCategory(sanitized);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category: category.trim() || 'general',
        description: description.trim(),
        isPublic: isGlobal,
        serverId: !isGlobal && selectedServerIds.length > 0 ? selectedServerIds[0] : undefined,
        serverIds: !isGlobal ? selectedServerIds : [],
        tags: category.trim() ? [category.trim()] : [],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Template"
      description="Save current layout as a reusable Discord Components V2 template."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!name.trim()}
            onClick={handleConfirmSave}
          >
            Save Template
          </Button>
        </div>
      }
    >
      <form onSubmit={handleConfirmSave} className="flex flex-col gap-4">
        {/* Template Name */}
        <TextInput
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Welcome Verification Hub"
          maxLength={100}
          required
        />

        {/* Category (no uppercase, no spaces) */}
        <div>
          <TextInput
            label="Category"
            value={category}
            onChange={handleCategoryChange}
            placeholder="e.g. onboarding, rules"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Single lowercase keyword only (no uppercase, no spaces).
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this template layout..."
            rows={3}
            maxLength={500}
            className="w-full px-3.5 py-2.5 rounded-apple-md bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-brand-red focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Template Scope */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">Template Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsGlobal(true)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                isGlobal
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Globe size={14} />
              Global
            </button>
            <button
              type="button"
              onClick={() => setIsGlobal(false)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-apple-md text-xs font-semibold transition-all cursor-pointer ${
                !isGlobal
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <ServerIcon size={14} />
              Server-Specific
            </button>
          </div>
        </div>

        {/* Discord Servers Assigned (Visible only when Server-Specific) */}
        {!isGlobal && (
          <div className="p-3.5 rounded-apple-lg bg-black/40 border border-white/10 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <ServerIcon size={14} className="text-zinc-400" />
                Discord Servers Assigned
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedServerIds.length} selected
              </span>
            </div>

            {loadingServers ? (
              <span className="text-xs text-zinc-500 py-1">Loading servers...</span>
            ) : connectedServers.length === 0 ? (
              <span className="text-xs text-zinc-500 py-1">
                No connected servers found. Current server context will be used.
              </span>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {connectedServers.map((srv) => {
                  const isChecked =
                    selectedServerIds.includes(srv.id) || selectedServerIds.includes(srv.slug);
                  return (
                    <label
                      key={srv.id}
                      className={`flex items-center gap-2.5 p-2 rounded-apple-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-brand-red/10 border-brand-red/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleServer(srv.id)}
                        className="w-3.5 h-3.5 rounded bg-black/60 border border-white/20 text-brand-red focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};
