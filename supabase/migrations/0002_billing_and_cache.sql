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

-- ---------------------------------------------------------------------------
-- increment_usage RPC: atomic read-check-write against public.users so
-- concurrent /api/analyze calls for the same user can't both sneak past the
-- monthly quota (classic TOCTOU). We run this as SECURITY DEFINER so RLS
-- doesn't block the update when called from a user-scoped client.
--
-- Parameters:
--   p_user_id      — user whose counter to bump
--   p_month        — YYYY-MM bucket key
--   p_unlimited    — true when the tier has no quota (pro / lifetime)
--   p_monthly_quota— max allowed checks per month (ignored when unlimited)
--
-- Returns the post-increment counter value on success.
-- Raises 'QUOTA_EXCEEDED' when the limit would be crossed so the API layer
-- can map it to a 402.
-- ---------------------------------------------------------------------------
create or replace function public.increment_usage(
  p_user_id uuid,
  p_month text,
  p_unlimited boolean,
  p_monthly_quota integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  -- Only allow the signed-in user (or service_role, which has auth.uid()
  -- == null) to modify their own counter — otherwise any authenticated
  -- browser client could silently mint unlimited quota or attack another
  -- user's quota via the RPC.
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  update public.users
     set usage_month = p_month,
         usage_count = case
           when usage_month = p_month then usage_count + 1
           else 1
         end
   where id = p_user_id
     and (
       p_unlimited
       or coalesce(
            case when usage_month = p_month then usage_count else 0 end,
            0
          ) < p_monthly_quota
     )
   returning usage_count into v_new_count;

  if v_new_count is null then
    raise exception 'QUOTA_EXCEEDED' using errcode = 'P0001';
  end if;

  return v_new_count;
end;
$$;

-- Decrement is used to roll back a charge when the downstream LLM call
-- fails, so we don't burn a free-tier slot for a transient error. Clamped
-- at 0 so it can't go negative.
create or replace function public.decrement_usage(
  p_user_id uuid,
  p_month text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  -- Same guard as increment_usage: service_role bypasses (auth.uid() is null),
  -- authenticated callers may only refund their own slot.
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  update public.users
     set usage_count = greatest(0, usage_count - 1)
   where id = p_user_id
     and usage_month = p_month
   returning usage_count into v_new_count;

  return coalesce(v_new_count, 0);
end;
$$;

-- RPC access is locked to service_role only. The server-side
-- `consumeUsage` / `refundUsage` helpers (see src/lib/billing/usage.ts)
-- use the admin client, so regular signed-in users can't call these
-- from the browser and reset their own quota counter.
revoke execute on function public.increment_usage(uuid, text, boolean, integer)
  from public, authenticated;
revoke execute on function public.decrement_usage(uuid, text)
  from public, authenticated;
grant execute on function public.increment_usage(uuid, text, boolean, integer)
  to service_role;
grant execute on function public.decrement_usage(uuid, text)
  to service_role;
