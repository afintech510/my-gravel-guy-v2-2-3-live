// Delivery day picker — pure functions only (no I/O, no Date.now() calls) so callers
// control "now" and results are deterministic and testable.
//
// All calendar math is done on a UTC-anchored Date used purely as a calendar cursor
// (year/month/day, no real instant semantics). It is always read back out through
// Intl.DateTimeFormat with timeZone: 'UTC', so results never depend on the host
// machine's local timezone — only on `now` and the metro's own timeZone (used once,
// up front, to resolve "today" and the current local hour for the cutoff check).

import type { Metro } from '../types';

export interface DeliveryDayOption {
  /** YYYY-MM-DD */
  date: string;
  /** e.g. 'Tue, Oct 6' */
  label: string;
  isSaturday: boolean;
  isRush: boolean;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

const getLocalParts = (date: Date, timeZone: string): LocalParts => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string): number => Number(parts.find(p => p.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') };
};

/** Calendar-day cursor: a UTC-anchored Date standing in for a local calendar date. */
const calendarDate = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const addCalendarDays = (date: Date, amount: number): Date => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
};

/** 0 = Sunday … 6 = Saturday */
const dayOfWeek = (date: Date): number => date.getUTCDay();

const toISODate = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const toLabel = (date: Date): string => {
  const parts = LABEL_FORMATTER.formatToParts(date);
  const get = (type: string): string => parts.find(p => p.type === type)?.value ?? '';
  return `${get('weekday')}, ${get('month')} ${get('day')}`;
};

/**
 * Build the next `days` deliverable calendar days for a metro, starting from the
 * earliest day the metro's nodes can deliver relative to `now`:
 *  - if the current local time (in metro.timeZone) is before the earliest node
 *    cutoffHour, the earliest option is tomorrow, flagged isRush
 *  - otherwise the earliest option is the day after tomorrow, and there is no rush option
 * Sundays are never offered. Saturdays are only offered if at least one node delivers
 * on Saturday.
 */
export const getDeliveryDayOptions = (metro: Metro, now: Date, days = 14): DeliveryDayOption[] => {
  const deliversSaturday = metro.nodes.some(n => n.deliversSaturday);
  const cutoffHour = metro.nodes.length ? Math.min(...metro.nodes.map(n => n.cutoffHour)) : 12;

  const { year, month, day, hour } = getLocalParts(now, metro.timeZone);
  const today = calendarDate(year, month, day);
  const beforeCutoff = hour < cutoffHour;

  const tomorrow = addCalendarDays(today, 1);
  const earliest = beforeCutoff ? tomorrow : addCalendarDays(today, 2);

  const options: DeliveryDayOption[] = [];
  let cursor = earliest;
  while (options.length < days) {
    const weekday = dayOfWeek(cursor);
    const isSunday = weekday === 0;
    const isSaturday = weekday === 6;
    if (!isSunday && (!isSaturday || deliversSaturday)) {
      options.push({
        date: toISODate(cursor),
        label: toLabel(cursor),
        isSaturday,
        isRush: beforeCutoff && cursor.getTime() === tomorrow.getTime(),
      });
    }
    cursor = addCalendarDays(cursor, 1);
  }
  return options;
};
