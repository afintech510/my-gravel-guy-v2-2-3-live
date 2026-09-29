import { describe, it, expect } from 'vitest';
import { isRpcMissing } from './rlsHotfixCompat';

describe('isRpcMissing', () => {
  it('recognizes PostgREST PGRST202 (function not found in schema cache)', () => {
    expect(isRpcMissing({ code: 'PGRST202', message: 'nope' })).toBe(true);
  });

  it('recognizes the "Could not find the function" message even without the code', () => {
    expect(isRpcMissing({ message: 'Could not find the function public.get_quote_by_id' })).toBe(true);
  });

  it('returns false for an unrelated error (e.g. a real invalid-token failure)', () => {
    expect(isRpcMissing({ code: 'P0001', message: 'invalid token' })).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isRpcMissing(null)).toBe(false);
    expect(isRpcMissing(undefined)).toBe(false);
  });
});
