-- Replace the 6 serial Supabase queries in upsertSessionFull() with a single
-- PL/pgSQL function that runs everything in one round trip and one implicit
-- transaction. The function is SECURITY DEFINER so it can bypass RLS for the
-- internal child-table deletes, but we verify ownership of the session row
-- before doing anything to prevent horizontal privilege escalation.

CREATE OR REPLACE FUNCTION public.upsert_session_full(
  p_session_id   uuid,
  p_user_id      uuid,
  p_title        text,
  p_stage        text,           -- sessions.stage enum cast inside
  p_idea_summary text,
  p_report_generation int,
  p_messages     jsonb,          -- array of {id, role, content, created_at}
  p_competitors  jsonb,          -- array of {title, url, snippet}
  p_report       jsonb,          -- null | full report object
  p_red_team     jsonb           -- null | full red_team_report object
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id uuid;
BEGIN
  -- ── 1. Ownership guard ────────────────────────────────────────────────────
  -- If the session already exists, verify it belongs to p_user_id.
  SELECT user_id INTO v_existing_user_id
  FROM   sessions
  WHERE  id = p_session_id;

  IF FOUND AND v_existing_user_id <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- ── 2. Upsert the session row ─────────────────────────────────────────────
  INSERT INTO sessions (id, user_id, title, stage, idea_summary, report_generation)
  VALUES (
    p_session_id,
    p_user_id,
    p_title,
    p_stage::session_stage,
    p_idea_summary,
    p_report_generation
  )
  ON CONFLICT (id) DO UPDATE SET
    title              = EXCLUDED.title,
    stage              = EXCLUDED.stage,
    idea_summary       = EXCLUDED.idea_summary,
    report_generation  = EXCLUDED.report_generation,
    updated_at         = now();

  -- ── 3. Replace messages ───────────────────────────────────────────────────
  DELETE FROM messages WHERE session_id = p_session_id;

  IF jsonb_array_length(p_messages) > 0 THEN
    INSERT INTO messages (id, session_id, role, content, created_at)
    SELECT
      (m->>'id')::uuid,
      p_session_id,
      (m->>'role')::message_role,
      m->>'content',
      (m->>'created_at')::timestamptz
    FROM jsonb_array_elements(p_messages) AS m;
  END IF;

  -- ── 4. Replace competitors ────────────────────────────────────────────────
  DELETE FROM competitors WHERE session_id = p_session_id;

  IF jsonb_array_length(p_competitors) > 0 THEN
    INSERT INTO competitors (session_id, title, url, snippet)
    SELECT
      p_session_id,
      c->>'title',
      c->>'url',
      c->>'snippet'
    FROM jsonb_array_elements(p_competitors) AS c;
  END IF;

  -- ── 5. Report ─────────────────────────────────────────────────────────────
  IF p_report IS NULL THEN
    DELETE FROM reports WHERE session_id = p_session_id;
  ELSE
    INSERT INTO reports (
      session_id, verdict, verdict_label, summary, scores,
      strengths, risks, unique_angles, tech_stack, roadmap, mvp_scope, insights
    )
    VALUES (
      p_session_id,
      (p_report->>'verdict')::verdict,
      p_report->>'verdict_label',
      p_report->>'summary',
      (p_report->'scores'),
      ARRAY(SELECT jsonb_array_elements_text(p_report->'strengths')),
      ARRAY(SELECT jsonb_array_elements_text(p_report->'risks')),
      ARRAY(SELECT jsonb_array_elements_text(p_report->'unique_angles')),
      (p_report->'tech_stack'),
      (p_report->'roadmap'),
      ARRAY(SELECT jsonb_array_elements_text(p_report->'mvp_scope')),
      p_report->'insights'
    )
    ON CONFLICT (session_id) DO UPDATE SET
      verdict       = EXCLUDED.verdict,
      verdict_label = EXCLUDED.verdict_label,
      summary       = EXCLUDED.summary,
      scores        = EXCLUDED.scores,
      strengths     = EXCLUDED.strengths,
      risks         = EXCLUDED.risks,
      unique_angles = EXCLUDED.unique_angles,
      tech_stack    = EXCLUDED.tech_stack,
      roadmap       = EXCLUDED.roadmap,
      mvp_scope     = EXCLUDED.mvp_scope,
      insights      = EXCLUDED.insights;
  END IF;

  -- ── 6. Red-team report ────────────────────────────────────────────────────
  IF p_red_team IS NULL THEN
    DELETE FROM red_team_reports WHERE session_id = p_session_id;
  ELSE
    INSERT INTO red_team_reports (
      session_id, verdict, reasons, silent_killers, report_generation
    )
    VALUES (
      p_session_id,
      p_red_team->>'verdict',
      ARRAY(SELECT jsonb_array_elements_text(p_red_team->'reasons')),
      ARRAY(SELECT jsonb_array_elements_text(p_red_team->'silent_killers')),
      (p_red_team->>'report_generation')::int
    )
    ON CONFLICT (session_id) DO UPDATE SET
      verdict           = EXCLUDED.verdict,
      reasons           = EXCLUDED.reasons,
      silent_killers    = EXCLUDED.silent_killers,
      report_generation = EXCLUDED.report_generation;
  END IF;

  -- ── 7. Return assembled session JSON in one query ─────────────────────────
  RETURN (
    SELECT jsonb_build_object(
      'session', jsonb_build_object(
        'id',                s.id,
        'title',             s.title,
        'stage',             s.stage,
        'idea_summary',      s.idea_summary,
        'report_generation', s.report_generation,
        'created_at',        s.created_at,
        'updated_at',        s.updated_at,
        'messages', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id',         m.id,
              'session_id', m.session_id,
              'role',       m.role,
              'content',    m.content,
              'created_at', m.created_at
            ) ORDER BY m.created_at
          )
          FROM messages m
          WHERE m.session_id = s.id
        ), '[]'::jsonb),
        'competitors', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'title',      cp.title,
              'url',        cp.url,
              'snippet',    cp.snippet
            )
          )
          FROM competitors cp
          WHERE cp.session_id = s.id
        ), '[]'::jsonb),
        'reports', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'session_id',   r.session_id,
              'verdict',      r.verdict,
              'verdict_label',r.verdict_label,
              'summary',      r.summary,
              'scores',       r.scores,
              'strengths',    r.strengths,
              'risks',        r.risks,
              'unique_angles',r.unique_angles,
              'tech_stack',   r.tech_stack,
              'roadmap',      r.roadmap,
              'mvp_scope',    r.mvp_scope,
              'insights',     r.insights
            )
          )
          FROM reports r
          WHERE r.session_id = s.id
        ), '[]'::jsonb),
        'red_team_reports', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'session_id',       rt.session_id,
              'verdict',          rt.verdict,
              'reasons',          rt.reasons,
              'silent_killers',   rt.silent_killers,
              'report_generation',rt.report_generation
            )
          )
          FROM red_team_reports rt
          WHERE rt.session_id = s.id
        ), '[]'::jsonb)
      )
    )
    FROM sessions s
    WHERE s.id = p_session_id
  );
END;
$$;

-- Grant execute to authenticated users only (not anon).
REVOKE ALL ON FUNCTION public.upsert_session_full FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upsert_session_full TO authenticated;

COMMENT ON FUNCTION public.upsert_session_full IS
  'Atomically replaces all child rows (messages, competitors, report, red_team_report) for a session in a single round trip. Returns the assembled session as JSONB.';
