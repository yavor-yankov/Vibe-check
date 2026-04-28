import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";

/**
 * POST /api/export-pdf — Generate a branded PDF of a session report.
 *
 * Body: { sessionId: string }
 * Returns: PDF file as application/pdf blob.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
  };
  if (!body.sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Fetch session + report data.
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, idea_summary")
    .eq("id", body.sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("session_id", session.id)
    .limit(1);
  const report = reports?.[0];
  if (!report) {
    return NextResponse.json(
      { error: "No report found for this session" },
      { status: 404 }
    );
  }

  const { data: competitors } = await supabase
    .from("competitors")
    .select("title, url, snippet")
    .eq("session_id", session.id);

  const { data: redTeamArr } = await supabase
    .from("red_team_reports")
    .select("verdict, reasons, silent_killers")
    .eq("session_id", session.id)
    .limit(1);
  const redTeam = redTeamArr?.[0] || null;

  const scores = report.scores as Record<string, number>;
  const strengths = (report.strengths as string[]) || [];
  const risks = (report.risks as string[]) || [];
  const uniqueAngles = (report.unique_angles as string[]) || [];

  // Build the PDF document.
  const pdfDoc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "Vibe Check Report"),
        React.createElement(
          Text,
          { style: styles.date },
          `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
        )
      ),
      // Title
      React.createElement(
        Text,
        { style: styles.title },
        session.title || "Untitled Idea"
      ),
      session.idea_summary &&
        React.createElement(
          Text,
          { style: styles.subtitle },
          session.idea_summary
        ),
      // Verdict
      React.createElement(
        View,
        { style: styles.verdictBox },
        React.createElement(
          Text,
          { style: styles.verdictLabel },
          `Verdict: ${report.verdict_label || report.verdict}`
        )
      ),
      // Scores
      React.createElement(
        View,
        { style: styles.scoresRow },
        ...Object.entries(scores).map(([key, value]) =>
          React.createElement(
            View,
            { key, style: styles.scoreItem },
            React.createElement(Text, { style: styles.scoreValue }, `${value}/10`),
            React.createElement(
              Text,
              { style: styles.scoreLabel },
              key.replace(/_/g, " ")
            )
          )
        )
      ),
      // Summary
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Summary"),
        React.createElement(Text, { style: styles.body }, report.summary)
      ),
      // Strengths
      strengths.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            "Strengths"
          ),
          ...strengths.map((s, i) =>
            React.createElement(Text, { key: i, style: styles.listItem }, `+ ${s}`)
          )
        ),
      // Risks
      risks.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, "Risks"),
          ...risks.map((r, i) =>
            React.createElement(Text, { key: i, style: styles.listItem }, `- ${r}`)
          )
        ),
      // Unique Angles
      uniqueAngles.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            "Unique Angles"
          ),
          ...uniqueAngles.map((a, i) =>
            React.createElement(Text, { key: i, style: styles.listItem }, `• ${a}`)
          )
        ),
      // Competitors
      competitors &&
        competitors.length > 0 &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            "Competitors"
          ),
          ...competitors.map((c, i) =>
            React.createElement(
              Text,
              { key: i, style: styles.listItem },
              `• ${c.title} — ${c.url}`
            )
          )
        ),
      // Red Team
      redTeam &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            Text,
            { style: styles.sectionTitle },
            "Devil's Advocate"
          ),
          React.createElement(
            Text,
            { style: styles.body },
            redTeam.verdict
          ),
          ...(redTeam.reasons || []).map((r: string, i: number) =>
            React.createElement(Text, { key: i, style: styles.listItem }, `• ${r}`)
          )
        ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          { style: styles.footerText },
          "Generated by Vibe Check — vibecheck.app"
        )
      )
    )
  );

  const buffer = await renderToBuffer(pdfDoc);
  const uint8 = new Uint8Array(buffer);

  const filename = `vibe-check-${(session.title || "report").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.pdf`;

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#f97316",
  },
  date: {
    fontSize: 9,
    color: "#666",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#555",
    marginBottom: 16,
  },
  verdictBox: {
    padding: 10,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  verdictLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  scoresRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  scoreItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  scoreLabel: {
    fontSize: 7,
    color: "#666",
    textTransform: "capitalize",
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  listItem: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#333",
    marginLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#999",
  },
});
