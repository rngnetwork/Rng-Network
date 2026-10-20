'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  disabled?: boolean;
  showTime?: boolean;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  error,
  disabled = false,
  showTime = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value || new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(selectedDate.getTime());
    newDate.setFullYear(viewYear, viewMonth, day);
    onChange(newDate);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newDate = new Date(selectedDate.getTime());
    if (type === 'hours') {
      newDate.setHours(val);
    } else {
      newDate.setMinutes(val);
    }
    onChange(newDate);
  };

  const formattedValue = value
    ? `${value.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}${
        showTime
          ? ` ${String(value.getHours()).padStart(2, '0')}:${String(
              value.getMinutes()
            ).padStart(2, '0')}`
          : ''
      }`
    : 'Select date & time';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`flex flex-col gap-1.5 w-full relative ${className}`} ref={containerRef}>
      {label ? (
        <span className="text-xs font-medium text-text-secondary select-none">{label}</span>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        aria-label={label ? `${label} - Select date and time` : 'Select date and time'}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-apple-md bg-[#0E0E12] border transition-all duration-150 select-none outline-none ${
          error
            ? 'border-accent-danger'
            : isOpen
            ? 'border-brand-red ring-2 ring-brand-red/20'
            : 'border-surface-border hover:border-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-canvas' : 'cursor-pointer'}`}
      >
        <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>
          {formattedValue}
        </span>
        <svg
          className="w-4 h-4 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute top-full mt-1.5 left-0 z-50 p-3 rounded-apple-md bg-surface-elevated border border-surface-border shadow-elevated backdrop-blur-md flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-apple-sm text-text-secondary hover:text-text-primary hover:bg-white/10"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-apple-sm text-text-secondary hover:text-text-primary hover:bg-white/10"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-medium text-text-tertiary py-1">
                {d}
              </span>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(viewYear, viewMonth, day);
              const isBeforeMin = minDate ? dateObj < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false;
              const isAfterMax = maxDate ? dateObj > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()) : false;
              const isDayDisabled = isBeforeMin || isAfterMax;

              const isSelected =
                value &&
                value.getDate() === day &&
                value.getMonth() === viewMonth &&
                value.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => !isDayDisabled && handleSelectDay(day)}
                  className={`w-7 h-7 text-xs rounded-apple-sm flex items-center justify-center transition-colors ${
                    isDayDisabled
                      ? 'opacity-25 cursor-not-allowed text-text-tertiary'
                      : isSelected
                      ? 'bg-brand-red text-white font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/10'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {showTime ? (
            <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Time</span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={selectedDate.getHours()}
                  onChange={(e) =>
                    handleTimeChange('hours', Math.min(Math.max(Number(e.target.value), 0), 23))
                  }
                  className="w-10 px-1 py-0.5 rounded-apple-sm bg-surface-canvas border border-surface-border text-center text-text-primary outline-none focus:border-brand-red"
                />
                <span className="text-text-tertiary">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={selectedDate.getMinutes()}
                  onChange={(e) =>
                    handleTimeChange('minutes', Math.min(Math.max(Number(e.target.value), 0), 59))
                  }
                  className="w-10 px-1 py-0.5 rounded-apple-sm bg-surface-canvas border border-surface-border text-center text-text-primary outline-none focus:border-brand-red"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? <span className="text-xs text-accent-danger">{error}</span> : null}
    </div>
  );
};
