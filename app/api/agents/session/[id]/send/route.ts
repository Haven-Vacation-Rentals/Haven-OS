import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { streamSend } from "@/lib/agents/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agents/session/[id]/send
 *
 * Sends a user prompt to an existing session and streams normalized
 * events back over SSE. Any signed-in user can send to a session they
 * already hold the id for (ids are unguessable).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id: sessionId } = await ctx.params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session id" },
      { status: 400 },
    );
  }

  let body: { prompt?: string };
  try {
    body = (await req.json()) as { prompt?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };

      try {
        for await (const ev of streamSend(sessionId, prompt)) {
          send(ev);
          if (ev.type === "done" || ev.type === "error") break;
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
