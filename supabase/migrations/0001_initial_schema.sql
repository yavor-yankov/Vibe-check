-- Vibe Check — initial schema
-- Phase 1 / PR-A.
--
-- Creates public.users (mirroring auth.users), sessions, messages, competitors,
-- reports, red_team_reports. Enables RLS on every table and restricts rows
-- to the owning user via auth.uid().
--
-- Run order: paste this file into the Supabase SQL editor, or use the Supabase
-- CLI (`supabase db push`) once the project is linked.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: extends auth.users with billing/tier metadata
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text not null,
  subscription_tier    text not null default 'free'
                       check (subscription_tier in ('free', 'pro', 'lifetime')),
  stripe_customer_id   text unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sessions: one vibe-check run per row
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users (id) on delete cascade,
  title                text not null default 'New idea',
  stage                text not null default 'intro'
                       check (stage in ('intro', 'interview', 'scanning', 'report')),
  idea_summary         text,
  report_generation    integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists sessions_user_id_updated_at_idx
  on public.sessions (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- messages: chat history per session
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references public.sessions (id) on delete cascade,
  role                 text not null check (role in ('user', 'assistant', 'system')),
  content              text not null,
  created_at           timestamptz not null default now()
);
create index if not exists messages_session_id_created_at_idx
  on public.messages (session_id, created_at);

-- ---------------------------------------------------------------------------
-- competitors: Tavily results per session
-- ---------------------------------------------------------------------------
create table if not exists public.competitors (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references public.sessions (id) on delete cascade,
  title                text not null,
  url                  text not null,
  snippet              text,
  created_at           timestamptz not null default now()
);
create index if not exists competitors_session_id_idx
  on public.competitors (session_id);

-- ---------------------------------------------------------------------------
-- reports: the scored analysis for a session (at most one)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null unique references public.sessions (id) on delete cascade,
  verdict              text not null
                       check (verdict in ('build_it', 'iterate', 'rethink', 'skip')),
  verdict_label        text not null,
  summary              text not null,
  scores               jsonb not null,
  strengths            jsonb not null default '[]'::jsonb,
  risks                jsonb not null default '[]'::jsonb,
  unique_angles        jsonb not null default '[]'::jsonb,
  tech_stack           jsonb not null,
  roadmap              jsonb not null default '[]'::jsonb,
  mvp_scope            jsonb not null default '[]'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- red_team_reports: devil's advocate pass (at most one per session)
-- ---------------------------------------------------------------------------
create table if not exists public.red_team_reports (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null unique references public.sessions (id) on delete cascade,
  verdict              text not null,
  reasons              jsonb not null default '[]'::jsonb,
  silent_killers       jsonb not null default '[]'::jsonb,
  report_generation    integer not null,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a public.users row when a new auth.users row appears.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- Users see only rows owned by auth.uid(). Service-role bypasses RLS and is
-- used by server-side admin operations (e.g. Stripe webhook updates).
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.sessions          enable row level security;
alter table public.messages          enable row level security;
alter table public.competitors       enable row level security;
alter table public.reports           enable row level security;
alter table public.red_team_reports  enable row level security;

-- users: own row only
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- sessions: own rows only
drop policy if exists sessions_all_own on public.sessions;
create policy sessions_all_own on public.sessions
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- messages / competitors / reports / red_team_reports: joined via sessions
drop policy if exists messages_all_own on public.messages;
create policy messages_all_own on public.messages
  for all
  using      (exists (select 1 from public.sessions s where s.id = messages.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = messages.session_id and s.user_id = auth.uid()));

drop policy if exists competitors_all_own on public.competitors;
create policy competitors_all_own on public.competitors
  for all
  using      (exists (select 1 from public.sessions s where s.id = competitors.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = competitors.session_id and s.user_id = auth.uid()));

drop policy if exists reports_all_own on public.reports;
create policy reports_all_own on public.reports
  for all
  using      (exists (select 1 from public.sessions s where s.id = reports.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = reports.session_id and s.user_id = auth.uid()));

drop policy if exists red_team_reports_all_own on public.red_team_reports;
create policy red_team_reports_all_own on public.red_team_reports
  for all
  using      (exists (select 1 from public.sessions s where s.id = red_team_reports.session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.sessions s where s.id = red_team_reports.session_id and s.user_id = auth.uid()));
