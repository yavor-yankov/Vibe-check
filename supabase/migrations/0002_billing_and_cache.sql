-- Vibe Check — billing + tavily cache
-- Phase 2 / PR-C.
--
-- Adds Stripe subscription metadata + a monthly usage counter to public.users,
-- and a lightweight cache for Tavily search responses so we don't burn the
-- 1k/mo free tier re-querying the same seeds.

-- ---------------------------------------------------------------------------
-- public.users: extend with billing + usage fields
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_price_id        text,
  add column if not exists subscription_status    text,
  add column if not exists current_period_end     timestamptz,
  -- usage counter reset monthly by /api/analyze on first write each month
  add column if not exists usage_month            text,
  add column if not exists usage_count            integer not null default 0;

-- ---------------------------------------------------------------------------
-- tavily_cache: keyed on normalized query, 7-day TTL
-- ---------------------------------------------------------------------------
create table if not exists public.tavily_cache (
  query_key     text primary key,
  query         text not null,
  response      jsonb not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '7 days')
);
create index if not exists tavily_cache_expires_at_idx
  on public.tavily_cache (expires_at);

-- The cache is read+written server-side via the service role client only.
-- Enable RLS and DO NOT grant any policy, so it's inaccessible via anon/auth.
alter table public.tavily_cache enable row level security;
