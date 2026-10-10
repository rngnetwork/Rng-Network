'use client';

import React, { useState } from 'react';
import {
  ComponentType,
  type Type17Container,
  type DiscordInnerComponent,
  type DiscordButtonComponent,
  type DiscordStringSelectComponent,
} from '@/lib/model/embed';
import { TextInput } from '@/components/common/input/TextInput';
import { PaletteComponentList } from './PaletteComponentList';
import { ContainerItemCard } from './ContainerItemCard';

export interface GlobalEditTabCoordinatorProps {
  messageContent: string;
  containers: Type17Container[];
  onChangeMessageContent: (content: string) => void;
  onAddContainer: () => void;
  onUpdateContainer: (
    containerId: string,
    updates: Partial<Type17Container>
  ) => void;
  onRemoveContainer: (containerId: string) => void;
  onAddComponent: (containerId: string, componentType: ComponentType) => void;
  onUpdateComponent: (
    containerId: string,
    componentId: string,
    updates: Partial<DiscordInnerComponent>
  ) => void;
  onRemoveComponent: (containerId: string, componentId: string) => void;
  onEditButton: (containerId: string, button: DiscordButtonComponent) => void;
  onEditSelectMenu: (
    containerId: string,
    select: DiscordStringSelectComponent
  ) => void;
  emojiPickerSlot?: React.ReactNode;
}

export const GlobalEditTabCoordinator: React.FC<
  GlobalEditTabCoordinatorProps
> = ({
  messageContent,
  containers,
  onChangeMessageContent,
  onAddContainer,
  onUpdateContainer,
  onRemoveContainer,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onEditButton,
  onEditSelectMenu,
  emojiPickerSlot,
}) => {
  const [selectedContainerId, setSelectedContainerId] = useState<string>(
    containers[0]?.id ?? ''
  );

  const activeContainerId =
    containers.find((c) => c.id === selectedContainerId)?.id ??
    containers[0]?.id ??
    '';

  return (
    <div className="flex flex-col gap-6">
      <PaletteComponentList
        containerCount={containers.length}
        onAddContainer={onAddContainer}
        onAddComponent={(componentType) => {
          if (activeContainerId) {
            onAddComponent(activeContainerId, componentType);
          }
        }}
      />

      <div className="p-4 rounded-apple-xl bg-surface-card border border-white/[0.08] flex flex-col gap-3">
        <TextInput
          label="Top-Level Text Display (Auto-Wrapped as Leading Type 10 Component)"
          value={messageContent}
          onChange={(e) => onChangeMessageContent(e.target.value)}
          placeholder="Optional introductory text or role ping above all Type 17 containers..."
          helperText="Discord Components V2 (flags: 32768) automatically wraps leading message content into a Type 10 Text Display block."
        />
        {emojiPickerSlot && <div className="pt-1">{emojiPickerSlot}</div>}
      </div>

      <div className="flex flex-col gap-5">
        {containers.map((container, idx) => (
          <ContainerItemCard
            key={container.id}
            container={container}
            index={idx}
            isSelected={container.id === activeContainerId}
            canRemove={containers.length > 1}
            onSelect={setSelectedContainerId}
            onUpdateContainer={onUpdateContainer}
            onRemoveContainer={onRemoveContainer}
            onAddComponent={onAddComponent}
            onUpdateComponent={onUpdateComponent}
            onRemoveComponent={onRemoveComponent}
            onEditButton={onEditButton}
            onEditSelectMenu={onEditSelectMenu}
          />
        ))}
      </div>
    </div>
  );
};
