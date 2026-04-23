import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { pingAgent } from "@/lib/agents/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const info = await pingAgent();
    return NextResponse.json({ ok: true, ...info });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
