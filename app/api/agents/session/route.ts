import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSession } from "@/lib/agents/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agents/session
 *
 * Creates a fresh Managed Agent session and returns its id. The id is
 * stored client-side so follow-up messages can reuse the same context.
 *
 * Any signed-in user can open a session (the sidebar Haven Assistant
 * uses this). The admin-only /agents page is gated at the page layer.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const sessionId = await createSession();
    return NextResponse.json({ sessionId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
