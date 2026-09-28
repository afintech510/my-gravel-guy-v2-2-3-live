import { describe, expect, it } from 'vitest';
import type { Metro } from '../types';
import { getDeliveryDayOptions } from './dates';

const chicagoMetroWithSaturday: Metro = {
  timeZone: 'America/Chicago',
  nodes: [{ id: 'n1', name: 'Node', publicLabel: 'Node', cutoffHour: 12, deliversSaturday: true }],
} as unknown as Metro;

const chicagoMetroNoSaturday: Metro = {
  timeZone: 'America/Chicago',
  nodes: [{ id: 'n1', name: 'Node', publicLabel: 'Node', cutoffHour: 12, deliversSaturday: false }],
} as unknown as Metro;

describe('getDeliveryDayOptions', () => {
  it('makes tomorrow the rush option when local time is before cutoff', () => {
    // 2026-09-28 is a Monday. 10:00 America/Chicago (UTC-5 in Sept, CDT) = 15:00 UTC.
    const now = new Date('2026-09-28T15:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroWithSaturday, now, 5);
    expect(options[0].date).toBe('2026-09-29');
    expect(options[0].isRush).toBe(true);
  });

  it('skips to the day after tomorrow, with no rush option, when local time is after cutoff', () => {
    // Same Monday, but 14:00 local (19:00 UTC) — after the noon cutoff.
    const now = new Date('2026-09-28T19:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroWithSaturday, now, 5);
    expect(options[0].date).toBe('2026-09-30');
    expect(options.every(o => !o.isRush)).toBe(true);
  });

  it('never offers a Sunday', () => {
    const now = new Date('2026-09-28T15:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroWithSaturday, now, 14);
    expect(options.some(o => new Date(`${o.date}T00:00:00Z`).getUTCDay() === 0)).toBe(false);
  });

  it('flags Saturdays and includes them when a node delivers on Saturday', () => {
    const now = new Date('2026-09-28T15:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroWithSaturday, now, 14);
    const saturday = options.find(o => o.date === '2026-10-03');
    expect(saturday).toBeDefined();
    expect(saturday!.isSaturday).toBe(true);
  });

  it('excludes Saturdays entirely when no node delivers on Saturday', () => {
    const now = new Date('2026-09-28T15:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroNoSaturday, now, 14);
    expect(options.some(o => o.date === '2026-10-03')).toBe(false);
    expect(options.some(o => o.isSaturday)).toBe(false);
  });

  it('returns the requested number of options', () => {
    const now = new Date('2026-09-28T15:00:00Z');
    const options = getDeliveryDayOptions(chicagoMetroWithSaturday, now, 7);
    expect(options).toHaveLength(7);
  });
});
