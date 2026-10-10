import { test, describe, vi, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import {
  TIMEZONE_OPTIONS,
  getDefaultUserTimezone,
  zonedTimeToUtcIso,
  formatUtcPreview
} from '@/lib/timezones';

describe('Timezone Catalog & Utilities (lib/timezones.ts)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TIMEZONE_OPTIONS catalog', () => {
    test('contains at least 40 rich timezone entries', () => {
      assert.ok(Array.isArray(TIMEZONE_OPTIONS), 'TIMEZONE_OPTIONS must be an array');
      assert.ok(TIMEZONE_OPTIONS.length >= 40, `Expected >= 40 options, got ${TIMEZONE_OPTIONS.length}`);
    });

    test('includes UTC in the catalog', () => {
      const utc = TIMEZONE_OPTIONS.find(tz => tz.value === 'UTC');
      assert.ok(utc, 'UTC must be present in TIMEZONE_OPTIONS');
      assert.strictEqual(utc.offsetMinutes, 0, 'UTC offsetMinutes must be 0');
      assert.ok(utc.label.includes('UTC'), 'UTC label must display UTC');
      assert.ok(typeof utc.region === 'string' && utc.region.length > 0, 'UTC region must be specified');
    });

    test('all entries have required fields with valid types and formats', () => {
      const seenValues = new Set();

      for (const tz of TIMEZONE_OPTIONS) {
        assert.ok(typeof tz.value === 'string' && tz.value.length > 0, `Option value must be non-empty: ${JSON.stringify(tz)}`);
        assert.ok(typeof tz.label === 'string' && tz.label.length > 0, `Option label must be non-empty for ${tz.value}`);
        assert.ok(typeof tz.region === 'string' && tz.region.length > 0, `Option region must be non-empty for ${tz.value}`);
        assert.ok(typeof tz.offsetMinutes === 'number' && !Number.isNaN(tz.offsetMinutes), `Option offsetMinutes must be a number for ${tz.value}`);
        assert.ok(tz.label.includes('UTC'), `Option label must display UTC offset info for ${tz.value}`);

        // Verify uniqueness
        assert.ok(!seenValues.has(tz.value), `Duplicate timezone value found: ${tz.value}`);
        seenValues.add(tz.value);

        // Verify valid IANA identifier by instantiating Intl.DateTimeFormat
        assert.doesNotThrow(() => {
          new Intl.DateTimeFormat(undefined, { timeZone: tz.value });
        }, `Invalid IANA timezone identifier: ${tz.value}`);
      }
    });

    test('covers major global regions', () => {
      const regions = new Set(TIMEZONE_OPTIONS.map(tz => tz.region));
      assert.ok(regions.size >= 4, `Expected diverse regions, found: ${Array.from(regions).join(', ')}`);
      
      const sampleZones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];
      for (const zone of sampleZones) {
        assert.ok(TIMEZONE_OPTIONS.some(tz => tz.value === zone), `Catalog missing expected zone: ${zone}`);
      }
    });
  });

  describe('getDefaultUserTimezone()', () => {
    test('resolves a valid timezone string or falls back to UTC', () => {
      const defaultTz = getDefaultUserTimezone();
      assert.ok(typeof defaultTz === 'string' && defaultTz.length > 0);
      assert.doesNotThrow(() => {
        new Intl.DateTimeFormat(undefined, { timeZone: defaultTz });
      });
    });

    test('safely falls back to UTC if Intl is unavailable or throws', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        throw new Error('Simulated Intl failure');
      });
      assert.strictEqual(getDefaultUserTimezone(), 'UTC');
    });

    test('safely falls back to UTC if resolved timezone is empty', () => {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({
          locale: 'en',
          calendar: 'gregory',
          numberingSystem: 'latn',
          timeZone: '',
        }),
        format: () => '',
        formatToParts: () => [],
        formatRange: () => '',
        formatRangeToParts: () => [],
      }));
      assert.strictEqual(getDefaultUserTimezone(), 'UTC');
    });
  });

  describe('zonedTimeToUtcIso(dateStr, timeStr, timeZone)', () => {
    test('accurately converts UTC local time', () => {
      const result = zonedTimeToUtcIso('2026-10-02', '12:00', 'UTC');
      assert.strictEqual(result, '2026-10-02T12:00:00.000Z');
    });

    test('accurately converts Asia/Kolkata (UTC+5:30) local time', () => {
      const result = zonedTimeToUtcIso('2026-10-02', '12:00', 'Asia/Kolkata');
      assert.strictEqual(result, '2026-10-02T06:30:00.000Z');
    });

    test('accurately converts America/New_York during Daylight Saving Time (EDT, UTC-4)', () => {
      const result = zonedTimeToUtcIso('2026-10-02', '12:00', 'America/New_York');
      assert.strictEqual(result, '2026-10-02T16:00:00.000Z');
    });

    test('accurately converts America/New_York during Standard Time (EST, UTC-5)', () => {
      const result = zonedTimeToUtcIso('2026-12-02', '12:00', 'America/New_York');
      assert.strictEqual(result, '2026-12-02T17:00:00.000Z');
    });

    test('accurately converts Asia/Tokyo (UTC+9) with day rollover', () => {
      const result = zonedTimeToUtcIso('2026-10-02', '03:00', 'Asia/Tokyo');
      assert.strictEqual(result, '2026-10-01T18:00:00.000Z');
    });

    test('accurately converts Europe/London during BST (UTC+1) and GMT (UTC+0)', () => {
      const bstResult = zonedTimeToUtcIso('2026-07-01', '12:00', 'Europe/London');
      assert.strictEqual(bstResult, '2026-07-01T11:00:00.000Z');

      const gmtResult = zonedTimeToUtcIso('2026-01-01', '12:00', 'Europe/London');
      assert.strictEqual(gmtResult, '2026-01-01T12:00:00.000Z');
    });

    test('throws an error for invalid date or time format', () => {
      assert.throws(() => zonedTimeToUtcIso('invalid-date', '12:00', 'UTC'), /Invalid date/i);
      assert.throws(() => zonedTimeToUtcIso('2026-10-02', 'invalid-time', 'UTC'), /Invalid time/i);
    });

    test('falls back safely to UTC if invalid timeZone is provided', () => {
      const result = zonedTimeToUtcIso('2026-10-02', '12:00', 'Invalid/Timezone_Name');
      assert.strictEqual(result, '2026-10-02T12:00:00.000Z');
    });
  });

  describe('formatUtcPreview(utcIso, referenceDate)', () => {
    const fixedNow = new Date('2026-10-02T12:00:00.000Z');

    test('handles future target 45 minutes ahead', () => {
      const targetIso = '2026-10-02T12:45:00.000Z';
      const preview = formatUtcPreview(targetIso, fixedNow);

      assert.strictEqual(preview.isPast, false);
      assert.strictEqual(preview.diffMinutes, 45);
      assert.strictEqual(preview.relativeText, 'in 45 minutes');
      assert.ok(preview.formattedUtc.includes('2026-10-02 12:45 UTC'));
    });

    test('handles past target 45 minutes ago', () => {
      const targetIso = '2026-10-02T11:15:00.000Z';
      const preview = formatUtcPreview(targetIso, fixedNow);

      assert.strictEqual(preview.isPast, true);
      assert.strictEqual(preview.diffMinutes, -45);
      assert.strictEqual(preview.relativeText, '45 minutes ago');
      assert.ok(preview.formattedUtc.includes('2026-10-02 11:15 UTC'));
    });

    test('handles future targets in hours and days', () => {
      const target2h = '2026-10-02T14:00:00.000Z';
      const preview2h = formatUtcPreview(target2h, fixedNow);
      assert.strictEqual(preview2h.isPast, false);
      assert.strictEqual(preview2h.diffMinutes, 120);
      assert.strictEqual(preview2h.relativeText, 'in 2 hours');

      const target3d = '2026-10-05T12:00:00.000Z';
      const preview3d = formatUtcPreview(target3d, fixedNow);
      assert.strictEqual(preview3d.isPast, false);
      assert.strictEqual(preview3d.diffMinutes, 4320);
      assert.strictEqual(preview3d.relativeText, 'in 3 days');
    });

    test('handles past targets in hours and days', () => {
      const target3h = '2026-10-02T09:00:00.000Z';
      const preview3h = formatUtcPreview(target3h, fixedNow);
      assert.strictEqual(preview3h.isPast, true);
      assert.strictEqual(preview3h.diffMinutes, -180);
      assert.strictEqual(preview3h.relativeText, '3 hours ago');

      const target1d = '2026-10-01T12:00:00.000Z';
      const preview1d = formatUtcPreview(target1d, fixedNow);
      assert.strictEqual(preview1d.isPast, true);
      assert.strictEqual(preview1d.diffMinutes, -1440);
      assert.strictEqual(preview1d.relativeText, '1 day ago');
    });

    test('handles sub-minute targets', () => {
      const nowIso = '2026-10-02T12:00:20.000Z';
      const preview = formatUtcPreview(nowIso, fixedNow);
      assert.strictEqual(preview.isPast, false);
      assert.strictEqual(preview.diffMinutes, 0);
      assert.strictEqual(preview.relativeText, 'in less than a minute');

      const justPastIso = '2026-10-02T11:59:40.000Z';
      const pastPreview = formatUtcPreview(justPastIso, fixedNow);
      assert.strictEqual(pastPreview.isPast, true);
      assert.strictEqual(pastPreview.diffMinutes, 0);
      assert.strictEqual(pastPreview.relativeText, 'just now');
    });

    test('gracefully handles invalid ISO string', () => {
      const preview = formatUtcPreview('invalid-iso-string', fixedNow);
      assert.strictEqual(preview.isPast, false);
      assert.strictEqual(preview.diffMinutes, 0);
      assert.strictEqual(preview.formattedUtc, 'Invalid Date');
      assert.strictEqual(preview.relativeText, 'invalid date');
    });
  });
});
