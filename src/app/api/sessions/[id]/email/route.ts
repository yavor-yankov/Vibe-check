import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/db/sessions";
import { sendReportEmail } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getSession(supabase, id);
  if (!session || !session.report) {
    return Response.json({ error: "Session or report not found" }, { status: 404 });
  }

  const email = user.email;
  if (!email) {
    return Response.json({ error: "No email on account" }, { status: 400 });
  }

  try {
    const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecheck.app"}/dashboard`;
    await sendReportEmail(
      email,
      reportUrl,
      session.report.verdict,
      session.report.verdictLabel,
      session.report.scores.overall,
      session.report.summary
    );
    return Response.json({ sent: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Email failed" },
      { status: 500 }
    );
  }
}
