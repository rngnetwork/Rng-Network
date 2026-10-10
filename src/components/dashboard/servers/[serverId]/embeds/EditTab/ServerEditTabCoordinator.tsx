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
import { ServerDiscordEmojiPicker } from '../emoji/ServerDiscordEmojiPicker';

export interface ServerEditTabCoordinatorProps {
  serverId: string;
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
}

export const ServerEditTabCoordinator: React.FC<
  ServerEditTabCoordinatorProps
> = ({
  serverId,
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
}) => {
  return (
    <GlobalEditTabCoordinator
      messageContent={messageContent}
      containers={containers}
      onChangeMessageContent={onChangeMessageContent}
      onAddContainer={onAddContainer}
      onUpdateContainer={onUpdateContainer}
      onRemoveContainer={onRemoveContainer}
      onAddComponent={onAddComponent}
      onUpdateComponent={onUpdateComponent}
      onRemoveComponent={onRemoveComponent}
      onEditButton={onEditButton}
      onEditSelectMenu={onEditSelectMenu}
      emojiPickerSlot={
        <div className="max-w-md">
          <ServerDiscordEmojiPicker
            serverId={serverId}
            onSelectEmojiToken={(token) => {
              onChangeMessageContent(
                messageContent ? `${messageContent} ${token}` : token
              );
            }}
          />
        </div>
      }
    />
  );
};
