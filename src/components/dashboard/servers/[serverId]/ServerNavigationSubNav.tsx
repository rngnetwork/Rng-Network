'use client';

import React from 'react';
import { ServerNavigationTabStrip, ServerNavigationTabStripProps } from './ServerNavigationTabStrip';

export const ServerNavigationSubNav: React.FC<ServerNavigationTabStripProps> = (props) => {
  return <ServerNavigationTabStrip {...props} />;
};
