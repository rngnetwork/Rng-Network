'use client';

import React from 'react';
import type { AnalyticsMetricPoint } from '@/lib/model/analytics';
import { Card } from '@/components/common/containers/Card';
import { ProgressBar } from '@/components/common/feedback/ProgressBar';

export interface InteractionActivityChartProps {
  series: AnalyticsMetricPoint[];
}

export const InteractionActivityChart: React.FC<InteractionActivityChartProps> = ({
  series,
}) => {
  const maxTotal = Math.max(
    1,
    ...series.map((p) => p.dispatches + p.interactions)
  );

  return (
    <Card
      title="Daily Dispatch & Interaction Volume"
      subtitle="Aggregated telemetry across Discord Components V2 messages"
    >
      {series.length === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-500">
          No telemetry points recorded for this server yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {series.map((point) => {
            const total = point.dispatches + point.interactions;
            const percent = Math.round((total / maxTotal) * 100);
            return (
              <div key={point.date} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300">{point.date}</span>
                  <span className="text-zinc-400">
                    {point.dispatches} Dispatches · {point.interactions} Interactions
                    {point.errors > 0 ? ` · ${point.errors} Errors` : ''}
                  </span>
                </div>
                <ProgressBar
                  value={percent}
                  variant={point.errors > 0 ? 'warning' : 'crimson'}
                  showPercentage={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
