// Client-side wrapper around the `google-merchant-sync` Supabase edge function.
//
// This replaces the old pattern where `GoogleShoppingManager.tsx` held a Merchant Center
// OAuth access token in React state and called `GoogleMerchantCenterAPI` (merchantCenter.ts)
// directly from the browser — see docs/metro/research/ai-ads-and-google-shopping.md B4 #5.
// The edge function now holds the Google credential; this client only ever sends the
// caller's own Supabase session (via `supabase.functions.invoke`, which attaches the current
// auth token automatically) and receives back a JSON summary.
//
// `merchantCenter.ts` / `feedGenerator.ts` are NOT deleted — feedGenerator.ts's XML feed
// export is still useful for manual/ad-hoc feed inspection, and merchantCenter.ts is kept
// only as a reference for the previous (now-sunsetting) Content API v2.1 shape. Neither
// should be wired to a live Google call going forward; use this client instead.
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_NAME = 'google-merchant-sync';

export interface MerchantSyncRequest {
  dryRun?: boolean;
  metroSlug?: string;
}

export interface MerchantSyncCounts {
  regions: number;
  productInputs: number;
  regionalInventories: number;
}

export interface MerchantSyncItemResult {
  kind: 'region' | 'productInput' | 'regionalInventory';
  key: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface MerchantSyncResponse {
  dryRun: boolean;
  metroFilter: string | null;
  generatedAt: string;
  priceBookGeneratedAt: string;
  counts: MerchantSyncCounts;
  payloads?: {
    regions: unknown[];
    productInputs: unknown[];
    regionalInventories: unknown[];
  };
  results?: {
    succeeded: number;
    failed: number;
    failures: MerchantSyncItemResult[];
  };
}

export class MerchantSyncError extends Error {}

async function callMerchantSync(request: MerchantSyncRequest): Promise<MerchantSyncResponse> {
  const { data, error } = await supabase.functions.invoke<MerchantSyncResponse>(FUNCTION_NAME, {
    body: request,
  });

  if (error) {
    throw new MerchantSyncError(error.message || 'google-merchant-sync call failed');
  }
  if (!data) {
    throw new MerchantSyncError('google-merchant-sync returned no data');
  }
  return data;
}

/** Fetches the built Merchant API payloads (regions, productInputs, regionalInventories)
 * without calling Google. Safe to call repeatedly — this never touches Google or writes
 * anything. Optionally scope to one metro via `metroSlug`. */
export const runMerchantSyncDryRun = (metroSlug?: string): Promise<MerchantSyncResponse> =>
  callMerchantSync({ dryRun: true, metroSlug });

/** Actually pushes the price book to Google Merchant Center via the Merchant API.
 * Requires GOOGLE_MERCHANT_ACCOUNT_ID / GOOGLE_SERVICE_ACCOUNT_JSON / (optionally)
 * GOOGLE_MERCHANT_DATA_SOURCE_ID to be configured as edge function secrets — see
 * docs/metro/research/merchant-api-implementation.md. */
export const runMerchantSyncLive = (metroSlug?: string): Promise<MerchantSyncResponse> =>
  callMerchantSync({ dryRun: false, metroSlug });
