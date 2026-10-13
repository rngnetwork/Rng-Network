'use client';

import React from 'react';
import type {
  ComponentType,
  Type17Container,
  DiscordInnerComponent,
  DiscordButtonComponent,
  DiscordStringSelectComponent,
} from '@/lib/model/embed';
import { GlobalEditTabCoordinator } from '@/components/dashboard/embeds/EditTab/GlobalEditTabCoordinator';

export interface ServerEditTabCoordinatorProps {
  serverId: string;
  messageContent: string;
  containers: Type17Container[];
  onChangeMessageContent: (content: string) => void;
  onAddContainer: () => void;
  onUpdateContainer: (
    cIdx: number,
    updates: Partial<Type17Container>
  ) => void;
  onRemoveContainer: (cIdx: number) => void;
  onMoveContainer: (cIdx: number, direction: 'up' | 'down') => void;
  onUpdateAuthor: (cIdx: number, key: 'name' | 'icon_url', val: string) => void;
  onUpdateFooter: (cIdx: number, key: 'text' | 'icon_url', val: string) => void;
  onAddField: (cIdx: number) => void;
  onUpdateField: (
    cIdx: number,
    fIdx: number,
    key: 'name' | 'value' | 'inline',
    val: string | boolean
  ) => void;
  onRemoveField: (cIdx: number, fIdx: number) => void;
  onAddComponent: (cIdx: number, componentType: ComponentType) => void;
  onUpdateComponent: (
    cIdx: number,
    compIdx: number,
    updated: DiscordInnerComponent
  ) => void;
  onRemoveComponent: (cIdx: number, compIdx: number) => void;
  onDuplicateComponent: (cIdx: number, compIdx: number) => void;
  onEditButton: (
    cIdx: number,
    button: DiscordButtonComponent,
    rowId?: string
  ) => void;
  onEditSelectMenu: (
    cIdx: number,
    select: DiscordStringSelectComponent
  ) => void;
  onOpenPaletteModal: (cIdx: number) => void;
  onOpenEmojiPicker?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ServerEditTabCoordinator: React.FC<
  ServerEditTabCoordinatorProps
> = ({
  serverId: _serverId,
  messageContent,
  containers,
  onChangeMessageContent,
  onAddContainer,
  onUpdateContainer,
  onRemoveContainer,
  onMoveContainer,
  onUpdateAuthor,
  onUpdateFooter,
  onAddField,
  onUpdateField,
  onRemoveField,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent,
  onDuplicateComponent,
  onEditButton,
  onEditSelectMenu,
  onOpenPaletteModal,
  onOpenEmojiPicker,
}) => {
  return (
    <GlobalEditTabCoordinator
      messageContent={messageContent}
      containers={containers}
      onChangeMessageContent={onChangeMessageContent}
      onAddContainer={onAddContainer}
      onUpdateContainer={onUpdateContainer}
      onRemoveContainer={onRemoveContainer}
      onMoveContainer={onMoveContainer}
      onUpdateAuthor={onUpdateAuthor}
      onUpdateFooter={onUpdateFooter}
      onAddField={onAddField}
      onUpdateField={onUpdateField}
      onRemoveField={onRemoveField}
      onAddComponent={onAddComponent}
      onUpdateComponent={onUpdateComponent}
      onRemoveComponent={onRemoveComponent}
      onDuplicateComponent={onDuplicateComponent}
      onEditButton={onEditButton}
      onEditSelectMenu={onEditSelectMenu}
      onOpenPaletteModal={onOpenPaletteModal}
      onOpenEmojiPicker={onOpenEmojiPicker}
    />
  );
};
