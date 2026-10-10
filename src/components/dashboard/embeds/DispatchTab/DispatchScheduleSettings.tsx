'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { DateTimePicker } from '@/components/common/input/DateTimePicker';

export interface DispatchScheduleSettingsProps {
  isScheduled: boolean;
  scheduledDate?: Date;
  onToggleScheduled: (scheduled: boolean) => void;
  onChangeScheduledDate: (date: Date) => void;
}

export const DispatchScheduleSettings: React.FC<
  DispatchScheduleSettingsProps
> = ({
  isScheduled,
  scheduledDate,
  onToggleScheduled,
  onChangeScheduledDate,
}) => {
  return (
    <div className="p-4 rounded-apple-xl bg-black/30 border border-white/[0.08] flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-apple-md bg-brand-red/10 border border-brand-red/20 text-brand-red">
            <Clock size={16} />
          </div>
          <div>
            <span className="text-xs font-semibold text-white">
              Two-Phase Queue Scheduled Delivery
            </span>
            <p className="text-[11px] text-zinc-400">
              Enqueue into Redis ZSET (`dispatch:queue:scheduled`) with permission decay protection
            </p>
          </div>
        </div>

        <ToggleSwitch
          checked={isScheduled}
          onChange={onToggleScheduled}
          label={isScheduled ? 'Scheduled' : 'Immediate'}
        />
      </div>

      {isScheduled && (
        <div className="pt-2 border-t border-white/[0.06] max-w-md">
          <DateTimePicker
            label="Target Execution Timestamp"
            value={scheduledDate}
            minDate={new Date()}
            onChange={onChangeScheduledDate}
          />
        </div>
      )}
    </div>
  );
};
