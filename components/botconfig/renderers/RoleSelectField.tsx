"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Shield, ChevronDown, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASTField, DiscordRoleOption } from '../types';

interface RoleSelectFieldProps {
  field: ASTField;
  roles: DiscordRoleOption[];
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function RoleSelectField({
  field,
  roles,
  onChange,
  disabled = false,
}: RoleSelectFieldProps) {
  const isMulti = Boolean(field.multiSelect);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues: string[] = useMemo(() => {
    if (isMulti) {
      return Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
    }
    return field.value ? [String(field.value)] : [];
  }, [field.value, isMulti]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.id.includes(q));
  }, [roles, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (roleId: string) => {
    if (isMulti) {
      const exists = selectedValues.includes(roleId);
      const next = exists
        ? selectedValues.filter((id) => id !== roleId)
        : [...selectedValues, roleId];
      onChange(next);
    } else {
      onChange(roleId);
      setIsOpen(false);
    }
  };

  const handleRemove = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMulti) {
      onChange(selectedValues.filter((id) => id !== roleId));
    } else {
      onChange('');
    }
  };

  const getRoleById = (id: string) => roles.find((r) => r.id === id);

  return (
    <div className="flex flex-col gap-2 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          {field.label}
          {field.validation?.required && <span className="text-red-400">*</span>}
          {field.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              {field.badge}
            </span>
          )}
        </label>
        {isMulti && (
          <span className="text-[11px] font-mono text-zinc-500">
            {selectedValues.length} selected
          </span>
        )}
      </div>

      {field.description && (
        <p className="text-xs text-zinc-400 leading-relaxed -mt-1">{field.description}</p>
      )}

      {/* Selected Tags (if multi-select) */}
      {isMulti && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selectedValues.map((id) => {
            const role = getRoleById(id);
            const color = role?.color || '#9CA3AF';
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-200"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span>@{role?.name || `role-${id}`}</span>
                {!disabled && !field.disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(id, e)}
                    className="hover:text-red-400 p-0.5"
                    aria-label="Remove role"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled || field.disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 focus:border-red-500 text-left text-xs md:text-sm text-white flex items-center justify-between gap-2 transition-all focus:shadow-[0_0_20px_rgba(225,29,46,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 truncate">
          {!isMulti && selectedValues[0] ? (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getRoleById(selectedValues[0])?.color || '#9CA3AF' }}
              />
              <span className="truncate">@{getRoleById(selectedValues[0])?.name || selectedValues[0]}</span>
            </>
          ) : (
            <span className="text-zinc-500">{field.placeholder || (isMulti ? 'Select roles...' : 'Select role...')}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-red-400' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#0e0e11] border border-white/15 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(225,29,46,0.2)] overflow-hidden flex flex-col max-h-64"
          >
            {/* Search Input */}
            <div className="p-2.5 border-b border-white/10 flex items-center gap-2 bg-black/40">
              <Search size={14} className="text-zinc-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto p-1.5 flex flex-col gap-0.5">
              {!isMulti && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs text-zinc-400 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span>No Role Selected</span>
                  {!selectedValues[0] && <Check size={14} className="text-red-400" />}
                </button>
              )}

              {filteredRoles.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No roles found
                </div>
              ) : (
                filteredRoles.map((role) => {
                  const isSelected = selectedValues.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleSelect(role.id)}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-red-500/15 text-white border border-red-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: role.color || '#9CA3AF' }}
                        />
                        <span className="truncate">@{role.name}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">#{role.id}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-red-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
