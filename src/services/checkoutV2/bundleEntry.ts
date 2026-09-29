// Combined entry point for scripts/checkout/export-checkout-v2-bundle.mjs — fans every pure
// checkout-v2 module's exports, plus the (self-contained, zero-import) HTML email templates they
// reuse, into one Deno-importable bundle: supabase/functions/_shared/checkout-v2.bundle.js.
// Same pattern as src/metro/checkout/bundleEntry.ts / scripts/metro/export-metro-checkout-bundle.mjs.
export * from './contract';
export * from './pricing';
export * from './metadata';
export * from './binding';
export * from './statusMapping';
export * from './idempotency';
export * from './emailPayload';
export * from './orderRecords';
export { generateCustomerConfirmationEmail, generateInternalNotificationEmail } from '../../utils/emailTemplates';
