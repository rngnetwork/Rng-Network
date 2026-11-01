'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { BotModuleFieldSchema } from '@/lib/model/bot-module';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { TextInput } from '@/components/common/input/TextInput';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { DiscordRoleSelect, type DiscordRoleOption } from '@/components/common/input/DiscordRoleSelect';
import { DiscordChannelSelect, type DiscordChannelOption } from '@/components/common/input/DiscordChannelSelect';
import { TagInput } from '@/components/common/input/TagInput';
import { Slider } from '@/components/common/input/Slider';
import { SegmentedControl } from '@/components/common/input/SegmentedControl';
import { DiscordMarkdownEditor } from '@/components/common/input/DiscordMarkdownEditor';
import { Hash, Plus, Trash2, X, ChevronDown, Check, Folder, Volume2 } from 'lucide-react';

export interface ServerModuleFieldRendererProps {
  modKey: string;
  fieldName: string;
  fieldDef?: BotModuleFieldSchema;
  rawValue: unknown;
  fieldDisabled: boolean;
  isSaving: boolean;
  serverChannels: DiscordChannelOption[];
  serverRoles: DiscordRoleOption[];
  channelOptions: DropdownOption[];
  roleOptions: DropdownOption[];
  onFieldChange: (modKey: string, fieldName: string, value: unknown) => void;
}

function resolveFieldLabel(
  fieldName: string,
  fieldDef?: BotModuleFieldSchema
): string {
  return fieldDef?.label || fieldDef?.displayName || fieldName;
}

function parseArrayValue(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(String).filter((x) => x && x !== 'null' && x !== 'undefined');
  }
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter((x) => x && x !== 'null' && x !== 'undefined');
      }
    } catch {
      return [];
    }
  }
  if (typeof val === 'string' && val.trim().length > 0 && val.trim() !== '[]' && val.trim() !== 'null') {
    return [val.trim()];
  }
  return [];
}

function parseDictionaryValue(val: unknown): Record<string, string> {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v != null && String(v).trim() && String(v).trim() !== 'null') {
        res[String(k).trim()] = String(v).trim();
      }
    }
    return res;
  }
  if (typeof val === 'string' && val.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parseDictionaryValue(parsed);
      }
    } catch {
      return {};
    }
  }
  return {};
}

interface MultiChannelPickerProps {
  label: string;
  description?: string;
  selectedIds: string[];
  channels: DiscordChannelOption[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}

const MultiChannelPicker: React.FC<MultiChannelPickerProps> = ({
  label,
  description,
  selectedIds,
  channels,
  disabled,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const toggleChannel = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((cId) => cId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeChannel = (id: string) => {
    if (disabled) return;
    onChange(selectedIds.filter((cId) => cId !== id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
    setIsOpen(false);
  };

  const categories = channels.filter((c) => c.type === 4);
  const categoryIds = new Set(categories.map((c) => c.id));

  const uncategorized = channels.filter(
    (c) => c.type !== 4 && (!c.parentId || !categoryIds.has(c.parentId))
  );

  const categorizedGroups = categories
    .map((cat) => ({
      category: cat,
      channels: channels.filter((c) => c.type !== 4 && c.parentId === cat.id),
    }))
    .filter((group) => group.channels.length > 0);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        {selectedIds.length > 0 && !disabled ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-brand-red hover:underline cursor-pointer"
          >
            Clear All
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-apple-md bg-zinc-900 border border-surface-border min-h-[38px]">
        {selectedIds.length === 0 ? (
          <span className="text-xs text-zinc-500 select-none">None (No channels selected)</span>
        ) : (
          selectedIds.map((id) => {
            const ch = channels.find((c) => c.id === id);
            const isVoice = ch?.type === 2 || ch?.type === 13;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-apple-sm bg-zinc-800 text-xs text-text-primary border border-surface-border truncate max-w-[200px]"
              >
                {isVoice ? (
                  <Volume2 size={11} className="text-zinc-400 shrink-0" />
                ) : (
                  <Hash size={11} className="text-zinc-400 shrink-0" />
                )}
                <span className="truncate">{ch?.name || `ID: ${id}`}</span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeChannel(id)}
                    className="text-zinc-400 hover:text-white shrink-0 ml-0.5 cursor-pointer"
                    aria-label={`Remove channel ${ch?.name || id}`}
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </span>
            );
          })
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between w-full min-h-[34px] px-3 py-1.5 rounded-apple-md bg-zinc-900/60 border border-surface-border text-xs text-left transition-colors duration-150 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-zinc-700 cursor-pointer'
        }`}
      >
        <span className="text-zinc-400">Add / toggle channel...</span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute top-full left-0 z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-apple-md bg-zinc-900 border border-surface-border shadow-elevated py-1">
          {uncategorized.map((channel) => {
            const isSelected = selectedIds.includes(channel.id);
            const isVoice = channel.type === 2 || channel.type === 13;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => toggleChannel(channel.id)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                  isSelected ? 'text-white font-medium bg-zinc-800/40' : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isVoice ? (
                    <Volume2 size={12} className="text-zinc-500 shrink-0" />
                  ) : (
                    <Hash size={12} className="text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </div>
                {isSelected ? <Check size={12} className="text-brand-red shrink-0" /> : null}
              </button>
            );
          })}

          {categorizedGroups.map((group) => (
            <div key={group.category.id} className="flex flex-col">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                <Folder size={11} className="shrink-0 text-zinc-600" />
                <span className="truncate">{group.category.name}</span>
              </div>
              {group.channels.map((channel) => {
                const isSelected = selectedIds.includes(channel.id);
                const isVoice = channel.type === 2 || channel.type === 13;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={`flex items-center justify-between w-full pl-6 pr-3 py-1.5 text-xs text-left hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'text-white font-medium bg-zinc-800/40' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isVoice ? (
                        <Volume2 size={12} className="text-zinc-500 shrink-0" />
                      ) : (
                        <Hash size={12} className="text-zinc-500 shrink-0" />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {isSelected ? <Check size={12} className="text-brand-red shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {description ? (
        <span className="text-[11px] text-text-tertiary">{description}</span>
      ) : null}
    </div>
  );
};

interface MultiRolePickerProps {
  label: string;
  description?: string;
  selectedIds: string[];
  roles: DiscordRoleOption[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
}

const MultiRolePicker: React.FC<MultiRolePickerProps> = ({
  label,
  description,
  selectedIds,
  roles,
  disabled,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const toggleRole = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((rId) => rId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeRole = (id: string) => {
    if (disabled) return;
    onChange(selectedIds.filter((rId) => rId !== id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        {selectedIds.length > 0 && !disabled ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-brand-red hover:underline cursor-pointer"
          >
            Clear All
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-apple-md bg-zinc-900 border border-surface-border min-h-[38px]">
        {selectedIds.length === 0 ? (
          <span className="text-xs text-zinc-500 select-none">None (No roles selected)</span>
        ) : (
          selectedIds.map((id) => {
            const r = roles.find((role) => role.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-apple-sm bg-zinc-800 text-xs text-text-primary border border-surface-border truncate max-w-[200px]"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: r?.color ? String(r.color) : '#71717a' }}
                />
                <span className="truncate">{r?.name || `ID: ${id}`}</span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeRole(id)}
                    className="text-zinc-400 hover:text-white shrink-0 ml-0.5"
                    aria-label={`Remove role ${r?.name || id}`}
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </span>
            );
          })
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between w-full min-h-[34px] px-3 py-1.5 rounded-apple-md bg-zinc-900/60 border border-surface-border text-xs text-left transition-colors duration-150 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-zinc-700 cursor-pointer'
        }`}
      >
        <span className="text-zinc-400">Add / toggle role...</span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute top-full left-0 z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-apple-md bg-zinc-900 border border-surface-border shadow-elevated py-1">
          {roles.map((role) => {
            const isSelected = selectedIds.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                  isSelected ? 'text-white font-medium bg-zinc-800/40' : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: role.color ? String(role.color) : '#71717a' }}
                  />
                  <span className="truncate">{role.name}</span>
                </div>
                {isSelected ? <Check size={12} className="text-brand-red shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {description ? (
        <span className="text-[11px] text-text-tertiary">{description}</span>
      ) : null}
    </div>
  );
};

interface LevelRolesEditorProps {
  label: string;
  description?: string;
  levelRolesMap: Record<string, string>;
  serverRoles: DiscordRoleOption[];
  disabled: boolean;
  onChange: (map: Record<string, string>) => void;
}

const LevelRolesEditor: React.FC<LevelRolesEditorProps> = ({
  label,
  description,
  levelRolesMap,
  serverRoles,
  disabled,
  onChange,
}) => {
  const entries = Object.entries(levelRolesMap).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  const handleLevelChange = (oldLevel: string, newLevel: string) => {
    if (disabled || !newLevel.trim()) return;
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(levelRolesMap)) {
      if (k === oldLevel) {
        updated[newLevel.trim()] = v;
      } else {
        updated[k] = v;
      }
    }
    onChange(updated);
  };

  const handleRoleChange = (level: string, roleId: string | null) => {
    if (disabled) return;
    if (!roleId) {
      handleDelete(level);
      return;
    }
    onChange({
      ...levelRolesMap,
      [level]: roleId,
    });
  };

  const handleDelete = (level: string) => {
    if (disabled) return;
    const updated = { ...levelRolesMap };
    delete updated[level];
    onChange(updated);
  };

  const handleAdd = () => {
    if (disabled) return;
    const existingLevels = Object.keys(levelRolesMap).map(Number).filter((n) => !isNaN(n));
    const nextLevel = existingLevels.length > 0 ? Math.max(...existingLevels) + 5 : 5;
    const defaultRole = serverRoles[0]?.id || '';
    onChange({
      ...levelRolesMap,
      [String(nextLevel)]: defaultRole,
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full col-span-1 md:col-span-2 p-3 rounded-apple-lg bg-surface-canvas border border-surface-border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-text-primary tracking-tight">{label}</span>
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
        {!disabled ? (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-apple-md bg-brand-red/10 border border-brand-red/30 text-xs font-medium text-brand-red hover:bg-brand-red/20 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Level Reward</span>
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="py-3 text-center text-xs text-text-tertiary">
          No level role rewards configured.
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-1">
          {entries.map(([lvl, roleId]) => (
            <div key={lvl} className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-1 shrink-0 w-28">
                <span className="text-xs text-text-secondary font-mono select-none">Lvl</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={lvl}
                  disabled={disabled}
                  onChange={(e) => handleLevelChange(lvl, e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary text-center focus:outline-none focus:border-brand-red/50"
                />
              </div>

              <div className="flex-1 min-w-0">
                <DiscordRoleSelect
                  roles={serverRoles}
                  value={roleId}
                  onChange={(newRoleId) => handleRoleChange(lvl, newRoleId)}
                  disabled={disabled}
                  placeholder="Select Reward Role"
                />
              </div>

              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleDelete(lvl)}
                  className="p-2 rounded-apple-md text-text-tertiary hover:text-brand-red hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
                  aria-label={`Remove level ${lvl} reward`}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface RoleMappingItem {
  roleKey: string;
  roleId: string;
  kind: 'ministry' | 'position' | 'rank';
  ministry?: string | null;
  position?: string | null;
  rank?: number | null;
}

function parseRoleMappings(value: unknown): RoleMappingItem[] {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return {
        roleKey: String(item || ''),
        roleId: '',
        kind: 'rank',
      };
    }
    const raw = item as Record<string, unknown>;
    return {
      roleKey: String(raw.roleKey ?? ''),
      roleId: String(raw.roleId ?? ''),
      kind: (raw.kind === 'ministry' || raw.kind === 'position' || raw.kind === 'rank') ? raw.kind : 'rank',
      ministry: raw.ministry != null ? String(raw.ministry) : null,
      position: raw.position != null ? String(raw.position) : null,
      rank: raw.rank !== undefined && raw.rank !== null ? Number(raw.rank) : null,
    };
  });
}

interface RoleMappingsEditorProps {
  label: string;
  description?: string;
  mappings: RoleMappingItem[];
  serverRoles: DiscordRoleOption[];
  disabled: boolean;
  onChange: (updated: RoleMappingItem[]) => void;
}

const RoleMappingsEditor: React.FC<RoleMappingsEditorProps> = ({
  label,
  description,
  mappings,
  serverRoles,
  disabled,
  onChange,
}) => {
  const handleItemChange = (index: number, patch: Partial<RoleMappingItem>) => {
    if (disabled) return;
    const next = [...mappings];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const handleDelete = (index: number) => {
    if (disabled) return;
    const next = mappings.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleAdd = () => {
    if (disabled) return;
    const defaultRoleId = serverRoles[0]?.id || '';
    const nextItem: RoleMappingItem = {
      roleKey: `role_${mappings.length + 1}`,
      roleId: defaultRoleId,
      kind: 'rank',
      ministry: null,
      position: null,
      rank: 1,
    };
    onChange([...mappings, nextItem]);
  };

  return (
    <div className="flex flex-col gap-3 w-full col-span-1 md:col-span-2 p-3.5 rounded-apple-lg bg-surface-canvas border border-surface-border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-text-primary tracking-tight">{label}</span>
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
        {!disabled ? (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-apple-md bg-brand-red/10 border border-brand-red/30 text-xs font-medium text-brand-red hover:bg-brand-red/20 transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Role Mapping</span>
          </button>
        ) : null}
      </div>

      {mappings.length === 0 ? (
        <div className="py-3 text-center text-xs text-text-tertiary">
          No role mappings configured.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-1">
          {mappings.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col lg:flex-row items-start lg:items-center gap-2 p-2.5 rounded-apple-md bg-zinc-900/60 border border-surface-border/60 w-full"
            >
              <div className="flex-1 w-full lg:w-40 min-w-0">
                <input
                  type="text"
                  value={item.roleKey}
                  disabled={disabled}
                  placeholder="roleKey (e.g. dev_agent)"
                  aria-label={`Role key for mapping ${idx + 1}`}
                  onChange={(e) => handleItemChange(idx, { roleKey: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-brand-red/50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex-1 w-full lg:w-56 min-w-0">
                <DiscordRoleSelect
                  roles={serverRoles}
                  value={item.roleId}
                  onChange={(newRoleId) => handleItemChange(idx, { roleId: newRoleId ?? '' })}
                  disabled={disabled}
                  placeholder="Select Discord Role"
                />
              </div>

              <div className="w-full lg:w-28 shrink-0">
                <select
                  value={item.kind}
                  disabled={disabled}
                  aria-label={`Kind for mapping ${idx + 1}`}
                  onChange={(e) =>
                    handleItemChange(idx, {
                      kind: e.target.value as 'ministry' | 'position' | 'rank',
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary focus:outline-none focus:border-brand-red/50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="rank">rank</option>
                  <option value="position">position</option>
                  <option value="ministry">ministry</option>
                </select>
              </div>

              <div className="flex-1 w-full lg:w-32 min-w-0">
                <input
                  type="text"
                  value={item.ministry ?? ''}
                  disabled={disabled}
                  placeholder="Ministry"
                  aria-label={`Ministry for mapping ${idx + 1}`}
                  onChange={(e) => handleItemChange(idx, { ministry: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-brand-red/50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex-1 w-full lg:w-32 min-w-0">
                <input
                  type="text"
                  value={item.position ?? ''}
                  disabled={disabled}
                  placeholder="Position"
                  aria-label={`Position for mapping ${idx + 1}`}
                  onChange={(e) => handleItemChange(idx, { position: e.target.value || null })}
                  className="w-full px-2 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-brand-red/50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="w-full lg:w-20 shrink-0">
                <input
                  type="number"
                  value={item.rank ?? ''}
                  disabled={disabled}
                  placeholder="Rank"
                  aria-label={`Rank for mapping ${idx + 1}`}
                  onChange={(e) =>
                    handleItemChange(idx, {
                      rank: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-apple-md bg-zinc-900 border border-surface-border text-xs text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-brand-red/50 disabled:cursor-not-allowed text-center"
                />
              </div>

              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="p-1.5 rounded-apple-md text-text-tertiary hover:text-brand-red hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
                  aria-label={`Remove role mapping ${item.roleKey}`}
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ServerModuleFieldRenderer: React.FC<ServerModuleFieldRendererProps> = ({
  modKey,
  fieldName,
  fieldDef,
  rawValue,
  fieldDisabled,
  isSaving,
  serverChannels,
  serverRoles,
  channelOptions,
  roleOptions,
  onFieldChange,
}) => {
  const label = resolveFieldLabel(fieldName, typeof fieldDef === 'object' && fieldDef !== null ? fieldDef : undefined);
  const description = fieldDef?.description;
  const rawType = typeof fieldDef?.type === 'string' ? fieldDef.type : 'STRING';
  const fieldType = rawType.toUpperCase();
  const isReadOnly = Boolean(fieldDef?.readOnly);
  const effectiveDisabled = fieldDisabled || isSaving || isReadOnly;

  const lowerName = fieldName.toLowerCase();
  const isMultiChannel = lowerName.includes('channels') || lowerName.includes('channelids');
  const isMultiRole = lowerName.includes('roles') || lowerName.includes('roleids');
  const isLevelRoles = lowerName === 'levelroles' || lowerName.endsWith('levelroles');
  const isRoleMappings = lowerName === 'rolemappings' || fieldType === 'ARRAY<OBJECT>';

  const isCategory = lowerName.endsWith('category') || lowerName.endsWith('categoryid');
  const isVoice = lowerName.endsWith('voicechannel') || lowerName.endsWith('voicechannelid');
  const channelTypeFilter: 'category' | 'voice' | 'text' = isCategory ? 'category' : isVoice ? 'voice' : 'text';
  const channelPlaceholder = isCategory ? 'None (Unset Category)' : 'None (Unset)';

  const isSingleChannel = (lowerName.endsWith('channel') || lowerName.endsWith('channelid') || isCategory) && !isMultiChannel;
  const isSingleRole = (lowerName.endsWith('role') || lowerName.endsWith('roleid')) && !isMultiRole && !isLevelRoles;

  const defaultFormatted = fieldDef?.default !== undefined && fieldDef.default !== null ? String(fieldDef.default) : 'none';

  if (isLevelRoles) {
    const levelRolesMap = parseDictionaryValue(rawValue);
    return (
      <LevelRolesEditor
        label={label}
        description={description}
        levelRolesMap={levelRolesMap}
        serverRoles={serverRoles}
        disabled={effectiveDisabled}
        onChange={(updated) => onFieldChange(modKey, fieldName, updated)}
      />
    );
  }

  if (isRoleMappings) {
    const mappings = parseRoleMappings(rawValue);
    return (
      <RoleMappingsEditor
        label={label}
        description={description}
        mappings={mappings}
        serverRoles={serverRoles}
        disabled={effectiveDisabled}
        onChange={(updated) => onFieldChange(modKey, fieldName, updated)}
      />
    );
  }

  if (isMultiChannel && serverChannels.length > 0) {
    const selectedChannelIds = parseArrayValue(rawValue);
    return (
      <MultiChannelPicker
        label={label}
        description={description}
        selectedIds={selectedChannelIds}
        channels={serverChannels}
        disabled={effectiveDisabled}
        onChange={(ids) => onFieldChange(modKey, fieldName, ids)}
      />
    );
  }

  if (isMultiRole && serverRoles.length > 0) {
    const selectedRoleIds = parseArrayValue(rawValue);
    return (
      <MultiRolePicker
        label={label}
        description={description}
        selectedIds={selectedRoleIds}
        roles={serverRoles}
        disabled={effectiveDisabled}
        onChange={(ids) => onFieldChange(modKey, fieldName, ids)}
      />
    );
  }

  if (isSingleChannel) {
    const channelVal = rawValue != null && rawValue !== 'none' && rawValue !== '' && rawValue !== 'null' ? String(rawValue) : null;

    if (serverChannels.length > 0) {
      return (
        <div className="flex flex-col gap-1.5 w-full">
          <DiscordChannelSelect
            label={label}
            channels={serverChannels}
            value={channelVal}
            onChange={(val) => onFieldChange(modKey, fieldName, val)}
            disabled={effectiveDisabled}
            placeholder={channelPlaceholder}
            channelTypeFilter={channelTypeFilter}
          />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
      );
    }

    const filteredOptions = isCategory
      ? channelOptions.filter((opt) => opt.value === 'none' || opt.label.startsWith('📁'))
      : channelOptions;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <Dropdown
          label={label}
          options={filteredOptions}
          value={channelVal || 'none'}
          onChange={(val) => onFieldChange(modKey, fieldName, val === 'none' ? null : val)}
          disabled={effectiveDisabled}
          placeholder={channelPlaceholder}
        />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
      );
  }

  if (isSingleRole) {
    const roleVal = rawValue != null && rawValue !== 'none' && rawValue !== '' && rawValue !== 'null' ? String(rawValue) : null;

    if (serverRoles.length > 0) {
      return (
        <div className="flex flex-col gap-1.5 w-full">
          <DiscordRoleSelect
            label={label}
            roles={serverRoles}
            value={roleVal}
            onChange={(val) => onFieldChange(modKey, fieldName, val)}
            disabled={effectiveDisabled}
            placeholder="None (Unset)"
          />
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <Dropdown
          label={label}
          options={roleOptions}
          value={roleVal || 'none'}
          onChange={(val) => onFieldChange(modKey, fieldName, val === 'none' ? null : val)}
          disabled={effectiveDisabled}
          placeholder="None (Unset)"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  const isArrayField = Array.isArray(rawValue) || fieldType === 'ARRAY' || Array.isArray(fieldDef?.default);
  if (isArrayField) {
    const tags = parseArrayValue(rawValue);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <TagInput
          label={label}
          value={tags}
          onChange={(newTags) => onFieldChange(modKey, fieldName, newTags)}
          disabled={effectiveDisabled}
          placeholder={`default: ${defaultFormatted}, type: ARRAY`}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldDef?.options && fieldDef.options.length >= 2 && fieldDef.options.length <= 4) {
    const segOptions = fieldDef.options.map((opt) => ({
      label: opt,
      value: opt,
    }));
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <SegmentedControl
          label={label}
          options={segOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={effectiveDisabled}
          size="sm"
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldDef?.options && fieldDef.options.length > 0) {
    const dropdownOptions = fieldDef.options.map((opt) => ({
      label: opt,
      value: opt,
    }));
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <Dropdown
          options={dropdownOptions}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={effectiveDisabled}
          searchable={true}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldType === 'BOOLEAN' || typeof rawValue === 'boolean') {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-apple-md bg-surface-canvas border border-surface-border">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text-primary select-none">{label}</span>
          {description ? (
            <span className="text-[11px] text-text-tertiary">{description}</span>
          ) : null}
        </div>
        <ToggleSwitch
          checked={Boolean(rawValue)}
          onChange={(checked) => onFieldChange(modKey, fieldName, checked)}
          disabled={effectiveDisabled}
          aria-label={label}
        />
      </div>
    );
  }

  if (
    (fieldType === 'INTEGER' || fieldType === 'FLOAT' || typeof rawValue === 'number') &&
    typeof fieldDef?.min === 'number' &&
    typeof fieldDef?.max === 'number'
  ) {
    const numVal = typeof rawValue === 'number' ? rawValue : (fieldDef.min ?? 0);
    const step = fieldType === 'FLOAT' ? 0.1 : 1;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <Slider
          label={label}
          min={fieldDef.min}
          max={fieldDef.max}
          step={step}
          value={numVal}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={effectiveDisabled}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldType === 'INTEGER' || fieldType === 'FLOAT' || typeof rawValue === 'number') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <TextInput
          type="number"
          aria-label={label}
          value={rawValue !== undefined && rawValue !== null ? String(rawValue) : ''}
          onChange={(e) => {
            const valStr = e.target.value;
            const parsed = valStr === '' ? null : Number(valStr);
            onFieldChange(modKey, fieldName, parsed);
          }}
          disabled={effectiveDisabled}
          placeholder={`default: ${defaultFormatted}, type: ${fieldType}`}
          min={fieldDef?.min}
          max={fieldDef?.max}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  if (fieldType === 'JSON') {
    const stringified =
      typeof rawValue === 'object' && rawValue !== null
        ? JSON.stringify(rawValue, null, 2)
        : String(rawValue ?? '');

    const jsonDefault = fieldDef?.default !== undefined && fieldDef.default !== null ? JSON.stringify(fieldDef.default) : 'none';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
        <textarea
          value={stringified}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onFieldChange(modKey, fieldName, parsed);
            } catch {
              onFieldChange(modKey, fieldName, e.target.value);
            }
          }}
          disabled={effectiveDisabled}
          rows={3}
          className="w-full px-3 py-2 rounded-apple-md bg-surface-canvas border border-surface-border text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-red/60 disabled:opacity-50 transition-colors"
          placeholder={`default: ${jsonDefault}, type: ${fieldType}`}
        />
        {description ? (
          <span className="text-[11px] text-text-tertiary">{description}</span>
        ) : null}
      </div>
    );
  }

  const isDescription =
    !isMultiChannel &&
    !isMultiRole &&
    !isLevelRoles &&
    !isRoleMappings &&
    !isSingleChannel &&
    !isSingleRole &&
    fieldType !== 'BOOLEAN' &&
    fieldType !== 'INTEGER' &&
    fieldType !== 'FLOAT' &&
    (
      lowerName.includes('description') ||
      (typeof fieldDef?.label === 'string' && fieldDef.label.toLowerCase().includes('description')) ||
      (typeof fieldDef?.displayName === 'string' && fieldDef.displayName.toLowerCase().includes('description')) ||
      fieldType === 'MARKDOWN' ||
      fieldType === 'TEXTAREA'
    );

  if (isDescription) {
    return (
      <div className="flex flex-col gap-1.5 w-full md:col-span-2">
        <DiscordMarkdownEditor
          label={label}
          helperText={description}
          value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
          onChange={(val) => onFieldChange(modKey, fieldName, val)}
          disabled={effectiveDisabled}
          placeholder={`default: ${defaultFormatted}, type: ${fieldType}`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-text-secondary select-none">{label}</label>
      <TextInput
        type="text"
        aria-label={label}
        value={typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')}
        onChange={(e) => onFieldChange(modKey, fieldName, e.target.value)}
        disabled={effectiveDisabled}
        placeholder={`default: ${defaultFormatted}, type: ${fieldType}`}
      />
      {description ? (
        <span className="text-[11px] text-text-tertiary">{description}</span>
      ) : null}
    </div>
  );
};
