-- 0007: Shareable report links
-- Adds a public_slug column to sessions for shareable read-only URLs.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE DEFAULT NULL;

-- Index for fast lookup by slug (public route).
CREATE INDEX IF NOT EXISTS idx_sessions_public_slug
  ON public.sessions (public_slug) WHERE public_slug IS NOT NULL;

-- Allow anonymous (unauthenticated) reads when a session has a public slug.
-- This policy enables the /report/[slug] public page.
CREATE POLICY "anon_read_public_sessions"
  ON public.sessions
  FOR SELECT
  TO anon
  USING (public_slug IS NOT NULL);

-- Also allow anonymous reads on related tables for public sessions.
CREATE POLICY "anon_read_public_reports"
  ON public.reports
  FOR SELECT
  TO anon
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE public_slug IS NOT NULL)
  );

CREATE POLICY "anon_read_public_competitors"
  ON public.competitors
  FOR SELECT
  TO anon
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE public_slug IS NOT NULL)
  );

CREATE POLICY "anon_read_public_red_team"
  ON public.red_team_reports
  FOR SELECT
  TO anon
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE public_slug IS NOT NULL)
  );
