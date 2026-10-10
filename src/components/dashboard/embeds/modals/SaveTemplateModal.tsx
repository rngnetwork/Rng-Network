'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/feedback/Modal';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Button } from '@/components/common/input/Button';

export interface SaveTemplateModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (metadata: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }) => Promise<void> | void;
}

const CATEGORY_OPTIONS: DropdownOption<string>[] = [
  { label: 'General (GENERAL)', value: 'GENERAL' },
  { label: 'Announcement (ANNOUNCEMENT)', value: 'ANNOUNCEMENT' },
  { label: 'Rules & Governance (RULES)', value: 'RULES' },
  { label: 'Support & Tickets (SUPPORT)', value: 'SUPPORT' },
  { label: 'Operations (OPERATIONS)', value: 'OPERATIONS' },
];

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  initialName = '',
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [tagsText, setTagsText] = useState('v2, command');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleConfirmSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        tags,
        isPublic,
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
      title="Save Components V2 Template"
      description="Persist reusable message layout to MongoDB (embed_templates) with optimistic concurrency."
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
      <div className="flex flex-col gap-4">
        <TextInput
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ministry Clearance Briefing..."
        />

        <TextInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe where this layout is dispatched..."
        />

        <Dropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />

        <TextInput
          label="Tags (Comma Separated)"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="briefing, high-command, v2"
        />

        <ToggleSwitch
          checked={isPublic}
          onChange={setIsPublic}
          label="Share Template Across Control Center"
          description="Allow other authorized ministers to load and dispatch this template"
        />
      </div>
    </Modal>
  );
};
