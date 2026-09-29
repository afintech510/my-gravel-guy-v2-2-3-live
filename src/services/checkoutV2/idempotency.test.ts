import { describe, expect, it } from 'vitest';
import { decideIdempotency } from './idempotency';

describe('decideIdempotency', () => {
  it('is not already processed when no rows exist', () => {
    expect(decideIdempotency([])).toEqual({ alreadyProcessed: false, rows: [] });
    expect(decideIdempotency(null)).toEqual({ alreadyProcessed: false, rows: [] });
    expect(decideIdempotency(undefined)).toEqual({ alreadyProcessed: false, rows: [] });
  });

  it('is already processed when rows exist for the stripe_session_id, and returns them verbatim', () => {
    const rows = [{ id: '1', stripe_session_id: 'cs_test_123' }];
    expect(decideIdempotency(rows)).toEqual({ alreadyProcessed: true, rows });
  });
});
