-- Add per-user webhook URL for Zapier / Make / custom integrations.
-- Users can configure this in Settings; the analyze route fires a POST
-- to this URL after every successful vibe-check with the full report payload.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS webhook_url text;

-- Only allow https:// or http://localhost URLs to prevent SSRF abuse.
ALTER TABLE public.users
  ADD CONSTRAINT users_webhook_url_https
  CHECK (
    webhook_url IS NULL
    OR webhook_url ~ '^https://'
    OR webhook_url ~ '^http://localhost'
    OR webhook_url ~ '^http://127\.0\.0\.1'
  );

COMMENT ON COLUMN public.users.webhook_url IS
  'Optional HTTPS endpoint that receives a POST with the analysis report JSON after every vibe check.';
