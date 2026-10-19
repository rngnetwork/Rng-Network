/**
 * RNG Control Center - Timezone Catalog & Conversion Engine
 *
 * Provides IANA timezone metadata, client-system timezone detection,
 * DST-aware zoned local to UTC conversion, and live UTC preview formatting.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
  offsetMinutes: number;
}

export interface UtcPreviewResult {
  formattedUtc: string;
  relativeText: string;
  isPast: boolean;
  diffMinutes: number;
}

/**
 * Curated catalog of >= 50 major IANA timezones spanning global regions.
 * Each entry provides value (IANA identifier), label (with UTC offset),
 * region group, and baseline offset in minutes.
 */
export const TIMEZONE_OPTIONS: readonly TimezoneOption[] = [
  // UTC / Universal
  { value: 'UTC', label: '(UTC+00:00) UTC / Coordinated Universal Time', region: 'UTC', offsetMinutes: 0 },

  // Americas - North America
  { value: 'America/New_York', label: '(UTC-05:00) New York, Eastern Time', region: 'Americas', offsetMinutes: -300 },
  { value: 'America/Chicago', label: '(UTC-06:00) Chicago, Central Time', region: 'Americas', offsetMinutes: -360 },
  { value: 'America/Denver', label: '(UTC-07:00) Denver, Mountain Time', region: 'Americas', offsetMinutes: -420 },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Los Angeles, Pacific Time', region: 'Americas', offsetMinutes: -480 },
  { value: 'America/Anchorage', label: '(UTC-09:00) Anchorage, Alaska Time', region: 'Americas', offsetMinutes: -540 },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Honolulu, Hawaii Time', region: 'Americas', offsetMinutes: -600 },
  { value: 'America/Phoenix', label: '(UTC-07:00) Phoenix, Arizona', region: 'Americas', offsetMinutes: -420 },
  { value: 'America/Toronto', label: '(UTC-05:00) Toronto, Eastern Canada', region: 'Americas', offsetMinutes: -300 },
  { value: 'America/Vancouver', label: '(UTC-08:00) Vancouver, Pacific Canada', region: 'Americas', offsetMinutes: -480 },
  { value: 'America/Halifax', label: '(UTC-04:00) Halifax, Atlantic Time', region: 'Americas', offsetMinutes: -240 },
  { value: 'America/St_Johns', label: '(UTC-03:30) St. John\'s, Newfoundland', region: 'Americas', offsetMinutes: -210 },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Mexico City, Central Time', region: 'Americas', offsetMinutes: -360 },

  // Americas - South America & Caribbean
  { value: 'America/Bogota', label: '(UTC-05:00) Bogota, Lima, Quito', region: 'Americas', offsetMinutes: -300 },
  { value: 'America/Caracas', label: '(UTC-04:00) Caracas', region: 'Americas', offsetMinutes: -240 },
  { value: 'America/Santiago', label: '(UTC-04:00) Santiago, Chile', region: 'Americas', offsetMinutes: -240 },
  { value: 'America/Buenos_Aires', label: '(UTC-03:00) Buenos Aires, Argentina', region: 'Americas', offsetMinutes: -180 },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Sao Paulo, Brasilia', region: 'Americas', offsetMinutes: -180 },

  // Europe
  { value: 'Europe/London', label: '(UTC+00:00) London, Dublin, Edinburgh', region: 'Europe', offsetMinutes: 0 },
  { value: 'Europe/Lisbon', label: '(UTC+00:00) Lisbon, Porto', region: 'Europe', offsetMinutes: 0 },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Brussels, Madrid', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Berlin, Frankfurt, Rome', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Amsterdam', label: '(UTC+01:00) Amsterdam, Vienna', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Rome', label: '(UTC+01:00) Rome, Milan', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid, Barcelona', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Stockholm', label: '(UTC+01:00) Stockholm, Oslo, Copenhagen', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Zurich', label: '(UTC+01:00) Zurich, Geneva', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Warsaw', label: '(UTC+01:00) Warsaw, Prague, Budapest', region: 'Europe', offsetMinutes: 60 },
  { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest', region: 'Europe', offsetMinutes: 120 },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv, Riga', region: 'Europe', offsetMinutes: 120 },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg', region: 'Europe', offsetMinutes: 180 },
  { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul, Ankara', region: 'Europe', offsetMinutes: 180 },

  // Asia & Middle East
  { value: 'Asia/Jerusalem', label: '(UTC+02:00) Jerusalem, Tel Aviv', region: 'Asia', offsetMinutes: 120 },
  { value: 'Asia/Riyadh', label: '(UTC+03:00) Riyadh, Kuwait, Doha', region: 'Asia', offsetMinutes: 180 },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai, Abu Dhabi, Muscat', region: 'Asia', offsetMinutes: 240 },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi, Islamabad, Tashkent', region: 'Asia', offsetMinutes: 300 },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, New Delhi, Kolkata', region: 'Asia', offsetMinutes: 330 },
  { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu', region: 'Asia', offsetMinutes: 345 },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka, Almaty', region: 'Asia', offsetMinutes: 360 },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta', region: 'Asia', offsetMinutes: 420 },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore, Kuala Lumpur', region: 'Asia', offsetMinutes: 480 },
  { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Hong Kong, Beijing', region: 'Asia', offsetMinutes: 480 },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Shanghai, Beijing', region: 'Asia', offsetMinutes: 480 },
  { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei', region: 'Asia', offsetMinutes: 480 },
  { value: 'Asia/Manila', label: '(UTC+08:00) Manila', region: 'Asia', offsetMinutes: 480 },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Osaka, Sapporo', region: 'Asia', offsetMinutes: 540 },
  { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul', region: 'Asia', offsetMinutes: 540 },

  // Oceania & Pacific
  { value: 'Australia/Perth', label: '(UTC+08:00) Perth, Western Australia', region: 'Oceania', offsetMinutes: 480 },
  { value: 'Australia/Adelaide', label: '(UTC+09:30) Adelaide, South Australia', region: 'Oceania', offsetMinutes: 570 },
  { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin, Northern Territory', region: 'Oceania', offsetMinutes: 570 },
  { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane, Queensland', region: 'Oceania', offsetMinutes: 600 },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne, Canberra', region: 'Oceania', offsetMinutes: 600 },
  { value: 'Pacific/Guam', label: '(UTC+10:00) Guam, Port Moresby', region: 'Pacific', offsetMinutes: 600 },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington', region: 'Oceania', offsetMinutes: 720 },
  { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji, Suva', region: 'Pacific', offsetMinutes: 720 },

  // Africa
  { value: 'Africa/Casablanca', label: '(UTC+01:00) Casablanca, Rabat', region: 'Africa', offsetMinutes: 60 },
  { value: 'Africa/Lagos', label: '(UTC+01:00) Lagos, West Central Africa', region: 'Africa', offsetMinutes: 60 },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo, Alexandria', region: 'Africa', offsetMinutes: 120 },
  { value: 'Africa/Johannesburg', label: '(UTC+02:00) Johannesburg, Pretoria, Cape Town', region: 'Africa', offsetMinutes: 120 },
  { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi, East Africa', region: 'Africa', offsetMinutes: 180 },
];

/**
 * Resolves the local system timezone via Intl.DateTimeFormat().resolvedOptions().timeZone.
 * Safely falls back to 'UTC' if unavailable, unsupported, or throwing in hostile runtime environments.
 */
export function getDefaultUserTimezone(): string {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && typeof tz === 'string' && tz.trim().length > 0) {
        return tz.trim();
      }
    }
  } catch {
    // Fall back safely to UTC
  }
  return 'UTC';
}

/**
 * Accurately converts a target local date (YYYY-MM-DD), local time (HH:mm or HH:mm:ss),
 * and target IANA timezone into an exact ISO-8601 UTC timestamp string.
 *
 * Uses iterative fixed-point projection via Intl.DateTimeFormat to guarantee correct
 * daylight saving time (DST) and standard time offset resolution.
 */
export function zonedTimeToUtcIso(dateStr: string, timeStr: string, timeZone: string = 'UTC'): string {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm`);
  }

  const dateParts = dateStr.trim().split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  const [year, month, day] = dateParts;

  const timeParts = timeStr.trim().split(':').map(Number);
  if (timeParts.length < 2 || timeParts.some(isNaN)) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm`);
  }
  const [hour, minute, second = 0] = timeParts;

  // Validate valid IANA timezone; fallback to UTC if unsupported
  let tz = timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'UTC';
  }

  // Fast path for UTC
  if (tz.toUpperCase() === 'UTC' || tz === 'Etc/UTC' || tz === 'GMT') {
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
    return utcDate.toISOString();
  }

  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });

  const getLocalMs = (utcMs: number): number => {
    const parts = formatter.formatToParts(new Date(utcMs));
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        p[part.type] = parseInt(part.value, 10);
      }
    }
    const h = p.hour === 24 ? 0 : (p.hour ?? 0);
    return Date.UTC(p.year, (p.month ?? 1) - 1, p.day ?? 1, h, p.minute ?? 0, p.second ?? 0, 0);
  };

  let guess = targetUtcMs;
  for (let i = 0; i < 4; i++) {
    const localMs = getLocalMs(guess);
    const diff = localMs - targetUtcMs;
    guess -= diff;
    if (diff === 0) break;
  }

  return new Date(guess).toISOString();
}

/**
 * Computes live UTC preview metrics from an ISO-8601 UTC string.
 * Returns formatted UTC display string, relative human duration text,
 * past status flag, and difference in minutes relative to reference date (defaults to now).
 */
export function formatUtcPreview(utcIso: string, referenceDate: Date | number = new Date()): UtcPreviewResult {
  const date = new Date(utcIso);
  if (isNaN(date.getTime())) {
    return {
      formattedUtc: 'Invalid Date',
      relativeText: 'invalid date',
      isPast: false,
      diffMinutes: 0,
    };
  }

  const nowMs = referenceDate instanceof Date ? referenceDate.getTime() : typeof referenceDate === 'number' ? referenceDate : Date.now();
  const targetMs = date.getTime();
  const diffMs = targetMs - nowMs;
  const isPast = diffMs < 0;
  const rawMinutes = Math.round(diffMs / 60000);
  const diffMinutes = rawMinutes === 0 ? 0 : rawMinutes;
  const absMinutes = Math.abs(diffMinutes);

  // Formatted UTC string: YYYY-MM-DD HH:mm UTC
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const formattedUtc = `${year}-${month}-${day} ${hours}:${minutes} UTC`;

  // Relative duration formatting
  let relativeText = '';
  if (absMinutes === 0) {
    relativeText = isPast ? 'just now' : 'in less than a minute';
  } else if (absMinutes < 60) {
    const unit = absMinutes === 1 ? 'minute' : 'minutes';
    relativeText = isPast ? `${absMinutes} ${unit} ago` : `in ${absMinutes} ${unit}`;
  } else if (absMinutes < 1440) {
    const hoursCount = Math.floor(absMinutes / 60);
    const unit = hoursCount === 1 ? 'hour' : 'hours';
    relativeText = isPast ? `${hoursCount} ${unit} ago` : `in ${hoursCount} ${unit}`;
  } else {
    const daysCount = Math.floor(absMinutes / 1440);
    const unit = daysCount === 1 ? 'day' : 'days';
    relativeText = isPast ? `${daysCount} ${unit} ago` : `in ${daysCount} ${unit}`;
  }

  return {
    formattedUtc,
    relativeText,
    isPast,
    diffMinutes,
  };
}

/**
 * Utility helper returning the active UTC offset in minutes for a given timezone at a specific date.
 */
export function getTimezoneOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        p[part.type] = parseInt(part.value, 10);
      }
    }
    const h = p.hour === 24 ? 0 : (p.hour ?? 0);
    const localMs = Date.UTC(p.year, (p.month ?? 1) - 1, p.day ?? 1, h, p.minute ?? 0, p.second ?? 0, 0);
    return Math.round((localMs - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}
