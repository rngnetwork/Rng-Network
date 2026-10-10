'use client';

import React from 'react';
import {
  ServerGeneralConfigForm,
  ServerGeneralConfigFormProps,
  ServerSettingsFormState,
} from './ServerGeneralConfigForm';

export type { ServerGeneralConfigFormProps, ServerSettingsFormState };

export const ServerGeneralSettingsForm: React.FC<ServerGeneralConfigFormProps> = (
  props
) => {
  return <ServerGeneralConfigForm {...props} />;
};
