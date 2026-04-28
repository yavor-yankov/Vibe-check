import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/account — Hard-delete all user data (GDPR account deletion).
 *
 * Removes: sessions, messages, competitors, reports, red_team_reports, user row.
 * Does NOT cancel Stripe subscription — caller should redirect to portal first.
 */
export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Delete all session-related data (cascading via session ownership).
  const { data: sessions } = await admin
    .from("sessions")
    .select("id")
    .eq("user_id", user.id);

  if (sessions && sessions.length > 0) {
    const ids = sessions.map((s) => s.id);
    await admin.from("red_team_reports").delete().in("session_id", ids);
    await admin.from("reports").delete().in("session_id", ids);
    await admin.from("competitors").delete().in("session_id", ids);
    await admin.from("messages").delete().in("session_id", ids);
    await admin.from("sessions").delete().eq("user_id", user.id);
  }

  // Delete user row.
  await admin.from("users").delete().eq("id", user.id);

  // Delete auth user (removes from Supabase auth system).
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ deleted: true });
}

/**
 * GET /api/account/export — Export all user data as JSON (GDPR data portability).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch all user data.
  const { data: userRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, messages(*), competitors(*), reports(*), red_team_reports(*)");

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      ...userRow,
    },
    sessions: sessions ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vibe-check-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
