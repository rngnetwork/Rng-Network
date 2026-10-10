'use client';

import React from 'react';
import {
  InteractionActivityChart,
  InteractionActivityChartProps,
} from './InteractionActivityChart';

export const AnalyticsOverviewChart: React.FC<InteractionActivityChartProps> = (props) => {
  return <InteractionActivityChart {...props} />;
};
