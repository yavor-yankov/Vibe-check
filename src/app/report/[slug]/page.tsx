import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /report/[slug] — Public, read-only report page.
 *
 * Renders a shared Vibe Check report without requiring authentication.
 * Includes "Powered by Vibe Check" branding with CTA.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("title, idea_summary")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!session) {
    return { title: "Report Not Found" };
  }

  return {
    title: `${session.title || "Vibe Check Report"} — Vibe Check`,
    description: session.idea_summary
      ? `AI-powered startup idea analysis: ${session.idea_summary.slice(0, 150)}`
      : "AI-powered startup idea analysis report",
    openGraph: {
      title: `${session.title || "Vibe Check Report"}`,
      description: session.idea_summary?.slice(0, 200) || "Startup idea validation report",
      type: "article",
    },
  };
}

export default async function PublicReportPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch session + report + competitors + red team via the public slug.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, idea_summary, stage")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!session || session.stage !== "report") {
    notFound();
  }

  const [{ data: reports }, { data: competitors }, { data: redTeam }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("*")
        .eq("session_id", session.id)
        .limit(1),
      supabase
        .from("competitors")
        .select("title, url, snippet")
        .eq("session_id", session.id),
      supabase
        .from("red_team_reports")
        .select("verdict, reasons, silent_killers")
        .eq("session_id", session.id)
        .limit(1),
    ]);

  const report = reports?.[0];
  if (!report) {
    notFound();
  }

  const scores = report.scores as Record<string, number>;
  const strengths = (report.strengths as string[]) || [];
  const risks = (report.risks as string[]) || [];
  const uniqueAngles = (report.unique_angles as string[]) || [];
  const redTeamReport = redTeam?.[0] || null;

  const VERDICT_COLORS: Record<string, string> = {
    build_it: "var(--good)",
    iterate: "var(--warn)",
    rethink: "var(--bad)",
    skip: "var(--bad)",
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[color:var(--border)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Sparkles className="w-5 h-5 text-[color:var(--accent)]" />
            Vibe Check
          </Link>
          <Link
            href="/pricing"
            className="text-sm px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white font-medium hover:brightness-110 transition-all"
          >
            Try it free
          </Link>
        </div>
      </header>

      {/* Report Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">
          {session.title || "Vibe Check Report"}
        </h1>
        {session.idea_summary && (
          <p className="text-[color:var(--muted)] mb-8">
            {session.idea_summary}
          </p>
        )}

        {/* Verdict */}
        <div className="mb-8">
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-bold text-white"
            style={{
              backgroundColor:
                VERDICT_COLORS[report.verdict] || "var(--muted)",
            }}
          >
            {report.verdict_label || report.verdict}
          </span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(scores).map(([key, value]) => (
            <div
              key={key}
              className="text-center p-3 rounded-xl bg-[color:var(--card)] border border-[color:var(--border)]"
            >
              <div className="text-2xl font-bold">{value}/10</div>
              <div className="text-xs text-[color:var(--muted)] capitalize">
                {key.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <section className="mb-8">
          <p className="text-[color:var(--foreground)] leading-relaxed">
            {report.summary}
          </p>
        </section>

        {/* Strengths & Risks */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {strengths.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-[color:var(--good)]">
                Strengths
              </h3>
              <ul className="space-y-1 text-sm">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[color:var(--good)]">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {risks.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-[color:var(--bad)]">
                Risks
              </h3>
              <ul className="space-y-1 text-sm">
                {risks.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[color:var(--bad)]">-</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Unique Angles */}
        {uniqueAngles.length > 0 && (
          <section className="mb-8">
            <h3 className="font-semibold mb-2">Unique Angles</h3>
            <ul className="space-y-1 text-sm">
              {uniqueAngles.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Competitors */}
        {competitors && competitors.length > 0 && (
          <section className="mb-8">
            <h3 className="font-semibold mb-2">Competitors Found</h3>
            <div className="space-y-2">
              {competitors.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[color:var(--card)] border border-[color:var(--border)]"
                >
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[color:var(--accent)] hover:underline"
                  >
                    {c.title}
                  </a>
                  <p className="text-xs text-[color:var(--muted)] mt-1 line-clamp-2">
                    {c.snippet}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Red Team */}
        {redTeamReport && (
          <section className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <h3 className="font-semibold mb-2 text-[color:var(--bad)]">
              Devil&apos;s Advocate
            </h3>
            <p className="text-sm font-medium mb-2">
              {redTeamReport.verdict}
            </p>
            {redTeamReport.reasons?.length > 0 && (
              <ul className="space-y-1 text-sm text-[color:var(--muted)]">
                {redTeamReport.reasons.map((r: string, i: number) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] text-center">
          <Sparkles className="w-8 h-8 text-[color:var(--accent)] mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">
            Want to validate your own idea?
          </h3>
          <p className="text-sm text-[color:var(--muted)] mb-4">
            Vibe Check runs your startup idea through an AI interview,
            competitor scan, and scored analysis — in under 5 minutes.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 rounded-lg bg-[color:var(--accent)] text-white font-medium hover:brightness-110 transition-all"
          >
            Start free — 3 checks/month
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[color:var(--border)] px-6 py-4 text-center text-xs text-[color:var(--muted)]">
        Powered by{" "}
        <Link href="/" className="text-[color:var(--accent)] hover:underline">
          Vibe Check
        </Link>
      </footer>
    </div>
  );
}
