import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AnalysisReport,
  ChatMessage,
  Competitor,
  RedTeamReport,
  Session,
} from "@/lib/types";

type DB = SupabaseClient<Database>;

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type CompetitorRow = Database["public"]["Tables"]["competitors"]["Row"];
type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type RedTeamRow = Database["public"]["Tables"]["red_team_reports"]["Row"];

interface SessionWithChildren extends SessionRow {
  messages: MessageRow[];
  competitors: CompetitorRow[];
  reports: ReportRow[];
  red_team_reports: RedTeamRow[];
}

/**
 * List every vibe-check session for the authenticated user, most recent first.
 *
 * Requires an auth-scoped client (`createSupabaseServerClient()`); RLS
 * guarantees the caller only sees their own rows.
 */
export async function listSessions(supabase: DB): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      messages ( * ),
      competitors ( * ),
      reports ( * ),
      red_team_reports ( * )
    `
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSession);
}

export async function getSession(
  supabase: DB,
  id: string
): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      messages ( * ),
      competitors ( * ),
      reports ( * ),
      red_team_reports ( * )
    `
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSession(data) : null;
}

export async function createSession(
  supabase: DB,
  userId: string,
  title = "New idea"
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return rowToSession({
    ...data,
    messages: [],
    competitors: [],
    reports: [],
    red_team_reports: [],
  });
}

export async function deleteSession(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSessionMeta(
  supabase: DB,
  id: string,
  patch: {
    title?: string;
    stage?: Session["stage"];
    ideaSummary?: string | null;
    reportGeneration?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
      ...(patch.ideaSummary !== undefined
        ? { idea_summary: patch.ideaSummary }
        : {}),
      ...(patch.reportGeneration !== undefined
        ? { report_generation: patch.reportGeneration }
        : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function appendMessage(
  supabase: DB,
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    id: message.id,
    session_id: sessionId,
    role: message.role,
    content: message.content,
    created_at: new Date(message.createdAt).toISOString(),
  });
  if (error) throw error;
}

export async function replaceCompetitors(
  supabase: DB,
  sessionId: string,
  competitors: Competitor[]
): Promise<void> {
  const del = await supabase
    .from("competitors")
    .delete()
    .eq("session_id", sessionId);
  if (del.error) throw del.error;
  if (competitors.length === 0) return;
  const { error } = await supabase.from("competitors").insert(
    competitors.map((c) => ({
      session_id: sessionId,
      title: c.title,
      url: c.url,
      snippet: c.snippet,
    }))
  );
  if (error) throw error;
}

export async function saveReport(
  supabase: DB,
  sessionId: string,
  report: AnalysisReport
): Promise<void> {
  const { error } = await supabase.from("reports").upsert(
    {
      session_id: sessionId,
      verdict: report.verdict,
      verdict_label: report.verdictLabel,
      summary: report.summary,
      scores: report.scores as unknown as Record<string, number>,
      strengths: report.strengths,
      risks: report.risks,
      unique_angles: report.uniqueAngles,
      tech_stack: report.techStack as unknown as Record<string, string[]>,
      roadmap: report.roadmap,
      mvp_scope: report.mvpScope,
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
}

export async function saveRedTeamReport(
  supabase: DB,
  sessionId: string,
  report: RedTeamReport,
  reportGeneration: number
): Promise<void> {
  const { error } = await supabase.from("red_team_reports").upsert(
    {
      session_id: sessionId,
      verdict: report.verdict,
      reasons: report.reasons,
      silent_killers: report.silentKillers,
      report_generation: reportGeneration,
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
}

export async function clearRedTeamReport(
  supabase: DB,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("red_team_reports")
    .delete()
    .eq("session_id", sessionId);
  if (error) throw error;
}

/**
 * Full-replace upsert that mirrors localStorage semantics: given a `Session`
 * object, make the database rows match it exactly.
 *
 * Used by `POST /api/sessions` so the client can keep its existing
 * "persist the whole session object on every change" flow.
 *
 * Preserves the caller-supplied `id`, `createdAt`. RLS ensures the caller can
 * only touch rows that belong to `userId`.
 */
export async function upsertSessionFull(
  supabase: DB,
  userId: string,
  session: Session
): Promise<Session> {
  // 1. Upsert the session row.
  const { error: upsertErr } = await supabase.from("sessions").upsert(
    {
      id: session.id,
      user_id: userId,
      title: session.title,
      stage: session.stage,
      idea_summary: session.ideaSummary ?? null,
      report_generation: session.reportGeneration ?? 0,
    },
    { onConflict: "id" }
  );
  if (upsertErr) throw upsertErr;

  // 2. Replace messages. Delete first so we don't accumulate rows across
  //    refine passes / edits.
  const delMsg = await supabase
    .from("messages")
    .delete()
    .eq("session_id", session.id);
  if (delMsg.error) throw delMsg.error;
  if (session.messages.length > 0) {
    const { error } = await supabase.from("messages").insert(
      session.messages.map((m) => ({
        id: m.id,
        session_id: session.id,
        role: m.role,
        content: m.content,
        created_at: new Date(m.createdAt).toISOString(),
      }))
    );
    if (error) throw error;
  }

  // 3. Replace competitors.
  await replaceCompetitors(supabase, session.id, session.competitors);

  // 4. Report — upsert if present, delete if cleared.
  if (session.report) {
    await saveReport(supabase, session.id, session.report);
  } else {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("session_id", session.id);
    if (error) throw error;
  }

  // 5. Red-team report — upsert if present, delete if cleared.
  if (session.redTeamReport) {
    await saveRedTeamReport(
      supabase,
      session.id,
      session.redTeamReport,
      session.reportGeneration ?? 0
    );
  } else {
    await clearRedTeamReport(supabase, session.id);
  }

  const reloaded = await getSession(supabase, session.id);
  if (!reloaded) {
    throw new Error("Session disappeared after upsert — RLS mismatch?");
  }
  return reloaded;
}

// ---------------------------------------------------------------------------
// Row → domain mapping. Keep in lockstep with src/lib/types.ts.
// ---------------------------------------------------------------------------
function rowToSession(row: SessionWithChildren): Session {
  return {
    id: row.id,
    title: row.title,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    stage: row.stage,
    ideaSummary: row.idea_summary ?? undefined,
    reportGeneration: row.report_generation,
    messages: (row.messages ?? [])
      .slice()
      .sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
      )
      .map(rowToMessage),
    competitors: (row.competitors ?? []).map(rowToCompetitor),
    report: row.reports?.[0] ? rowToReport(row.reports[0]) : null,
    redTeamReport: row.red_team_reports?.[0]
      ? rowToRedTeam(row.red_team_reports[0])
      : null,
  };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: Date.parse(row.created_at),
  };
}

function rowToCompetitor(row: CompetitorRow): Competitor {
  return {
    title: row.title,
    url: row.url,
    snippet: row.snippet ?? "",
  };
}

function rowToReport(row: ReportRow): AnalysisReport {
  const scores = row.scores;
  return {
    summary: row.summary,
    verdict: row.verdict,
    verdictLabel: row.verdict_label,
    scores: {
      viability: Number(scores.viability ?? 0),
      niche: Number(scores.niche ?? 0),
      problem: Number(scores.problem ?? 0),
      differentiation: Number(scores.differentiation ?? 0),
      overall: Number(scores.overall ?? 0),
    },
    strengths: row.strengths ?? [],
    risks: row.risks ?? [],
    uniqueAngles: row.unique_angles ?? [],
    techStack: {
      frontend: row.tech_stack.frontend ?? [],
      backend: row.tech_stack.backend ?? [],
      database: row.tech_stack.database ?? [],
      ai_ml: row.tech_stack.ai_ml,
      infra: row.tech_stack.infra ?? [],
      keyLibraries: row.tech_stack.keyLibraries ?? [],
    },
    roadmap: row.roadmap ?? [],
    mvpScope: row.mvp_scope ?? [],
  };
}

function rowToRedTeam(row: RedTeamRow): RedTeamReport {
  return {
    verdict: row.verdict,
    reasons: row.reasons ?? [],
    silentKillers: row.silent_killers ?? [],
  };
}
