-- Enable pg_cron and pg_net extensions for scheduled HTTP calls
-- Note: These extensions must be enabled in the Supabase dashboard first
-- (Database → Extensions → search for pg_cron and pg_net → Enable)

-- Schedule the abandoned cart processor to run every 15 minutes
-- This calls the process-abandoned-carts edge function via HTTP
-- The service role key must be set in the Supabase dashboard secrets

-- IMPORTANT: Run this manually in the Supabase SQL Editor after enabling extensions:
--
-- SELECT cron.schedule(
--   'process-abandoned-carts',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://losrkjvrcambvgijfism.supabase.co/functions/v1/process-abandoned-carts',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- Alternative: Set up a cron job on the Hetzner VPS:
-- */15 * * * * curl -s -X POST https://losrkjvrcambvgijfism.supabase.co/functions/v1/process-abandoned-carts \
--   -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" > /dev/null 2>&1

-- This migration is intentionally a no-op since pg_cron setup requires
-- the extensions to be enabled via the dashboard first.
-- The SQL above should be run manually after enabling pg_cron and pg_net.
SELECT 1;
