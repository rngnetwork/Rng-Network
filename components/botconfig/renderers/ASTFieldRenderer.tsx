"use client";

import React from 'react';
import { ASTField, DiscordChannelOption, DiscordRoleOption } from '../types';
import { ToggleField } from './ToggleField';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { NumberStepperField } from './NumberStepperField';
import { DropdownField } from './DropdownField';
import { ChannelSelectField } from './ChannelSelectField';
import { RoleSelectField } from './RoleSelectField';
import { DurationField } from './DurationField';
import { KeyValueListField } from './KeyValueListField';

interface ASTFieldRendererProps {
  field: ASTField;
  allFields: ASTField[];
  channels: DiscordChannelOption[];
  roles: DiscordRoleOption[];
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
}

export function ASTFieldRenderer({
  field,
  allFields,
  channels,
  roles,
  onChange,
  disabled = false,
}: ASTFieldRendererProps) {
  // Check dependsOn condition
  if (field.dependsOn) {
    const parentField = allFields.find((f) => f.id === field.dependsOn?.fieldId);
    if (parentField) {
      const op = field.dependsOn.operator || 'equals';
      const expected = field.dependsOn.value;
      const actual = parentField.value;

      if (op === 'truthy' && !actual) return null;
      if (op === 'falsy' && actual) return null;
      if (op === 'equals' && actual !== expected) return null;
      if (op === 'not_equals' && actual === expected) return null;
      if (op === 'contains') {
        if (!Array.isArray(actual) || !actual.includes(expected)) return null;
      }
    }
  }

  const handleChange = (val: any) => {
    onChange(field.id, val);
  };

  switch (field.type) {
    case 'toggle':
      return <ToggleField field={field} onChange={handleChange} disabled={disabled} />;
    case 'text':
      return <InputField field={field} onChange={handleChange} disabled={disabled} />;
    case 'textarea':
      return <TextareaField field={field} onChange={handleChange} disabled={disabled} />;
    case 'number':
      return <NumberStepperField field={field} onChange={handleChange} disabled={disabled} />;
    case 'select':
      return <DropdownField field={field} onChange={handleChange} disabled={disabled} />;
    case 'channel_select':
      return (
        <ChannelSelectField
          field={field}
          channels={channels}
          onChange={handleChange}
          disabled={disabled}
        />
      );
    case 'role_select':
      return (
        <RoleSelectField
          field={field}
          roles={roles}
          onChange={handleChange}
          disabled={disabled}
        />
      );
    case 'duration':
      return <DurationField field={field} onChange={handleChange} disabled={disabled} />;
    case 'key_value_list':
      return <KeyValueListField field={field} onChange={handleChange} disabled={disabled} />;
    default:
      return null;
  }
}
