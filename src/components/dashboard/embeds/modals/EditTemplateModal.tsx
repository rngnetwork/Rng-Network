'use client';

import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import type { TemplateData } from '@/lib/model/embed';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface EditTemplateModalProps {
  isOpen: boolean;
  template: TemplateData | null;
  currentCanvasContainerCount?: number;
  onClose: () => void;
  onSave: (
    templateId: string,
    updates: {
      name: string;
      description: string;
      category: string;
      tags: string[];
      isPublic: boolean;
      overwriteWithCanvas: boolean;
    }
  ) => Promise<void> | void;
}

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  isOpen,
  template,
  currentCanvasContainerCount = 0,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [tagsStr, setTagsStr] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [overwriteWithCanvas, setOverwriteWithCanvas] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setDescription(template.description || '');
      setCategory(template.category || 'GENERAL');
      setTagsStr(Array.isArray(template.tags) ? template.tags.join(', ') : '');
      setIsPublic(Boolean(template.public || template.isPublic));
      setOverwriteWithCanvas(false);
    }
  }, [template]);

  if (!template) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const tags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave(template.id, {
        name: name.trim(),
        description: description.trim(),
        category: category.trim().toUpperCase() || 'GENERAL',
        tags,
        isPublic,
        overwriteWithCanvas,
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
      title={`Edit Template (${template.name})`}
      description="Update template metadata or overwrite with current canvas."
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
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <TextInput
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Server Welcome Verification Hub"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextInput
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. GENERAL, ONBOARDING, RULES"
          />

          <TextInput
            label="Tags (Comma separated)"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="welcome, rules, roleplay"
          />
        </div>

        <TextInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of this layout..."
        />

        {/* Overwrite with Canvas callout */}
        <div className="p-3.5 rounded-apple-lg bg-black/40 border border-white/10 flex items-start gap-3">
          <div className="p-2 rounded-apple-md bg-white/[0.04] text-zinc-400 mt-0.5">
            <Layers size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overwriteWithCanvas}
                onChange={(e) => setOverwriteWithCanvas(e.target.checked)}
                className="w-4 h-4 rounded bg-black/60 border border-white/20 text-brand-red focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-white">
                Overwrite layout with active builder canvas
              </span>
            </label>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              When checked, this template&apos;s stored Components V2 layout will be replaced with your current active canvas ({currentCanvasContainerCount} container{currentCanvasContainerCount !== 1 ? 's' : ''}).
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-apple-lg bg-surface-card border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-white">Public Template</span>
            <p className="text-[11px] text-zinc-400">
              Make this template accessible to other authorized operators
            </p>
          </div>
          <ToggleSwitch checked={isPublic} onChange={setIsPublic} />
        </div>
      </form>
    </Modal>
  );
};
