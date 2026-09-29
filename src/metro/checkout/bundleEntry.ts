// Combined entry point for scripts/metro/export-metro-checkout-bundle.mjs.
//
// esbuild's `outfile` mode only supports a single entry point per output file, and
// create-metro-checkout (serverQuote.ts + conversion.ts's metadata builder),
// verify-metro-payment, and metro-stripe-webhook (verifyLogic.ts + conversion.ts's metadata
// parser/order-row builder/race resolver + emailTemplates.ts) all need to import named exports
// from the same checked-in Deno-importable bundle:
// supabase/functions/_shared/metro-checkout.bundle.js. This file exists purely to fan all four
// modules' exports into that one bundle — it has no logic of its own.
export * from './serverQuote';
export * from './verifyLogic';
export * from './conversion';
export * from './emailTemplates';
