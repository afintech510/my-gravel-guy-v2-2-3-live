// Idempotency decision for verify-payment-v2 (requirement (d): "if rows for that stripe_session_id
// already exist, return them (alreadyProcessed: true) without re-inserting or re-sending emails").
// Pure — the edge function does the actual `select ... where stripe_session_id = ?` and passes
// the result rows in here.
export interface ExistingOrderRowLike {
  id: string;
  stripe_session_id?: string | null;
}

export interface IdempotencyDecision {
  alreadyProcessed: boolean;
  rows: ExistingOrderRowLike[];
}

export const decideIdempotency = (existingRows: ExistingOrderRowLike[] | null | undefined): IdempotencyDecision => {
  const rows = existingRows ?? [];
  return { alreadyProcessed: rows.length > 0, rows };
};
