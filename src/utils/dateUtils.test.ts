import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  parseDateTime,
  formatLocalDate,
  formatDateTime,
  formatDateForDatabase,
  isDateOnly,
  getTodayDateString,
} from './dateUtils';

describe('parseLocalDate', () => {
  it('parses DATE-only string as local date (not UTC)', () => {
    const date = parseLocalDate('2025-07-25');
    expect(date).toBeInstanceOf(Date);
    // Key behavior: should be July 25, not July 24 (UTC shift issue)
    expect(date!.getDate()).toBe(25);
    expect(date!.getMonth()).toBe(6); // July = 6 (0-indexed)
    expect(date!.getFullYear()).toBe(2025);
  });

  it('returns null for null input', () => {
    expect(parseLocalDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseLocalDate(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate('  ')).toBeNull();
  });

  it('parses datetime strings with T normally', () => {
    const date = parseLocalDate('2025-07-25T10:30:00');
    expect(date).toBeInstanceOf(Date);
  });

  it('parses datetime strings with space normally', () => {
    const date = parseLocalDate('2025-07-25 10:30:00');
    expect(date).toBeInstanceOf(Date);
  });
});

describe('parseDateTime', () => {
  it('parses full datetime string', () => {
    const date = parseDateTime('2025-07-25T10:30:00Z');
    expect(date).toBeInstanceOf(Date);
  });

  it('returns null for null input', () => {
    expect(parseDateTime(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseDateTime(undefined)).toBeNull();
  });
});

describe('formatLocalDate', () => {
  it('formats DATE-only string with default format', () => {
    expect(formatLocalDate('2025-07-25')).toBe('Jul 25, 2025');
  });

  it('returns "Not set" for null', () => {
    expect(formatLocalDate(null as any)).toBe('Not set');
  });

  it('returns "Not set" for undefined', () => {
    expect(formatLocalDate(undefined as any)).toBe('Not set');
  });

  it('accepts custom format string', () => {
    expect(formatLocalDate('2025-07-25', 'yyyy-MM-dd')).toBe('2025-07-25');
  });
});

describe('formatDateTime', () => {
  it('returns "Not set" for null', () => {
    expect(formatDateTime(null as any)).toBe('Not set');
  });

  it('returns "Not set" for undefined', () => {
    expect(formatDateTime(undefined as any)).toBe('Not set');
  });

  it('formats a datetime string', () => {
    const result = formatDateTime('2025-07-25T10:30:00');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Not set');
  });
});

describe('formatDateForDatabase', () => {
  it('formats Date object as YYYY-MM-DD', () => {
    const date = new Date(2025, 6, 25); // July 25, 2025
    expect(formatDateForDatabase(date)).toBe('2025-07-25');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2025, 0, 5); // January 5, 2025
    expect(formatDateForDatabase(date)).toBe('2025-01-05');
  });

  it('returns null for null input', () => {
    expect(formatDateForDatabase(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(formatDateForDatabase(undefined)).toBeNull();
  });
});

describe('isDateOnly', () => {
  it('returns true for YYYY-MM-DD format', () => {
    expect(isDateOnly('2025-07-25')).toBe(true);
  });

  it('returns false for datetime with T', () => {
    expect(isDateOnly('2025-07-25T10:30:00')).toBe(false);
  });

  it('returns false for datetime with space', () => {
    expect(isDateOnly('2025-07-25 10:30:00')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDateOnly('')).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isDateOnly(' 2025-07-25 ')).toBe(true);
  });
});

describe('getTodayDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches today actual date', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(getTodayDateString()).toBe(expected);
  });
});
