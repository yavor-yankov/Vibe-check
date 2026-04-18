import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listSessions,
  upsertSessionFull,
} from "@/lib/db/sessions";
import type { Session } from "@/lib/types";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sessions = await listSessions(supabase);
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "List failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let session: Session;
  try {
    session = (await request.json()) as Session;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!session?.id || !session.title) {
    return NextResponse.json({ error: "Missing session fields" }, { status: 400 });
  }
  try {
    const saved = await upsertSessionFull(supabase, user.id, session);
    return NextResponse.json({ session: saved });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upsert failed" },
      { status: 500 }
    );
  }
}
