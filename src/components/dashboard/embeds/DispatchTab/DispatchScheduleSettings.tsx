'use client';

import React, { useMemo } from 'react';
import { Clock, Calendar, Globe, AlertTriangle } from 'lucide-react';
import { ToggleSwitch } from '@/components/common/input/ToggleSwitch';
import { Dropdown, type DropdownOption } from '@/components/common/input/Dropdown';
import { TextInput } from '@/components/common/input/TextInput';
import {
  TIMEZONE_OPTIONS,
  type UtcPreviewResult,
} from '@/lib/timezones';

export interface DispatchScheduleSettingsProps {
  isScheduled: boolean;
  onToggleScheduled: (scheduled: boolean) => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  selectedTime: string;
  onChangeTime: (time: string) => void;
  selectedTimezone: string;
  onChangeTimezone: (tz: string) => void;
  utcPreview: UtcPreviewResult;
}

export const DispatchScheduleSettings: React.FC<
  DispatchScheduleSettingsProps
> = ({
  isScheduled,
  onToggleScheduled,
  selectedDate,
  onChangeDate,
  selectedTime,
  onChangeTime,
  selectedTimezone,
  onChangeTimezone,
  utcPreview,
}) => {
  const timezoneOptions: DropdownOption<string>[] = useMemo(() => {
    return TIMEZONE_OPTIONS.map((tz) => ({
      value: tz.value,
      label: tz.label,
      description: `${tz.region} • ${tz.value}`,
    }));
  }, []);

  return (
    <div className="p-4 rounded-apple-xl bg-surface-card border border-white/10 flex flex-col gap-4 shadow-apple-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-apple-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock size={16} />
          </div>
          <div>
            <span className="text-xs font-semibold text-white">
              Two-Phase Queue Scheduled Delivery
            </span>
            <p className="text-[11px] text-zinc-400">
              {isScheduled
                ? `Dispatch queued for ${selectedDate} at ${selectedTime}${utcPreview.formattedUtc !== 'Invalid Date' ? ` (${utcPreview.formattedUtc})` : ''}`
                : 'Send immediately upon dispatch'}
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
        <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Date Selector */}
            <TextInput
              label="Execution Date"
              type="date"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
              leftIcon={<Calendar size={13} className="text-amber-400" />}
              className="[color-scheme:dark]"
            />

            {/* Time Selector */}
            <TextInput
              label="Execution Time"
              type="time"
              value={selectedTime}
              onChange={(e) => onChangeTime(e.target.value)}
              leftIcon={<Clock size={13} className="text-amber-400" />}
              className="[color-scheme:dark]"
            />

            {/* Timezone Selector */}
            <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-1">
              <Dropdown
                label="Timezone"
                options={timezoneOptions}
                value={selectedTimezone}
                onChange={(val) => onChangeTimezone(val)}
                searchable
              />
            </div>
          </div>

          {/* Live UTC Conversion Preview Banner */}
          <div
            className={`p-3 rounded-apple-md border flex items-center justify-between gap-3 ${
              utcPreview.isPast
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              {utcPreview.isPast ? (
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
              ) : (
                <Globe size={15} className="text-amber-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  Target UTC: {utcPreview.formattedUtc}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {utcPreview.isPast
                    ? `Warning: Selected time is in the past (${utcPreview.relativeText})`
                    : `Relative: ${utcPreview.relativeText}`}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-zinc-300">
              {selectedTimezone}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
