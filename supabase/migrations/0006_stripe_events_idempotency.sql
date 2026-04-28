-- 0006: Stripe webhook idempotency table
-- Prevents duplicate event processing when Stripe retries webhook delivery.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id   TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS — only accessible via service_role (admin client).
-- The table stores only event IDs for deduplication, no sensitive data.

COMMENT ON TABLE public.stripe_events IS
  'Tracks processed Stripe webhook event IDs for idempotency. Cleanup events older than 7 days periodically.';
