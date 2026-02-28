import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, normalizePhoneNumber, validatePhoneNumber } from './phoneUtils';

describe('formatPhoneNumber', () => {
  it('formats 10-digit number as (XXX) XXX-XXXX', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('formats 11-digit number starting with 1 as +1 (XXX) XXX-XXXX', () => {
    expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
  });

  it('strips non-numeric characters before formatting', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('+1-555-123-4567')).toBe('+1 (555) 123-4567');
  });

  it('returns unrecognized formats with + prefix', () => {
    expect(formatPhoneNumber('44123456789')).toBe('+44123456789');
  });

  it('does not double-add + prefix', () => {
    expect(formatPhoneNumber('+44123456789')).toBe('+44123456789');
  });
});

describe('normalizePhoneNumber', () => {
  it('normalizes 10-digit to +1 prefixed', () => {
    expect(normalizePhoneNumber('5551234567')).toBe('+15551234567');
  });

  it('normalizes 11-digit with leading 1', () => {
    expect(normalizePhoneNumber('15551234567')).toBe('+15551234567');
  });

  it('strips formatting characters', () => {
    expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567');
  });

  it('preserves already-normalized numbers', () => {
    expect(normalizePhoneNumber('+15551234567')).toBe('+15551234567');
  });

  it('adds + prefix to international numbers', () => {
    expect(normalizePhoneNumber('44123456789')).toBe('+44123456789');
  });
});

describe('validatePhoneNumber', () => {
  it('validates 10-digit US number', () => {
    expect(validatePhoneNumber('5551234567')).toBe(true);
  });

  it('validates 11-digit US number starting with 1', () => {
    expect(validatePhoneNumber('15551234567')).toBe(true);
  });

  it('validates formatted US number', () => {
    expect(validatePhoneNumber('(555) 123-4567')).toBe(true);
  });

  it('rejects too-short numbers', () => {
    expect(validatePhoneNumber('555123')).toBe(false);
  });

  it('rejects too-long numbers', () => {
    expect(validatePhoneNumber('155512345678')).toBe(false);
  });

  it('rejects 11-digit numbers not starting with 1', () => {
    expect(validatePhoneNumber('25551234567')).toBe(false);
  });
});
