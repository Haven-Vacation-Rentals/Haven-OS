/**
 * POST /api/public/career-resume
 *
 * Unauthenticated upload endpoint backing the resume attachment field on
 * the public /careers/[slug] apply form. Accepts a single multipart file
 * (PDF preferred, DOC/DOCX also allowed) up to 10 MB and stashes it in
 * the private `hr-resumes` Supabase bucket via the service-role client.
 *
 * Returns the storage path / sanitised filename / mime / size so the
 * client can hand them to the existing submitApplication server action.
 * Public callers never receive a public URL — HR opens files via signed
 * URLs minted server-side.
 *
 * Mitigations: per-IP rate limit, server-side type/size validation,
 * filename sanitisation. Role id is required and must match an open role
 * (defence in depth — pre-validates that there's a valid context for the
 * upload before the candidate row exists).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = new Set<string>(["pdf", "doc", "docx"]);
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function sanitiseFilename(name: string): string {
  const trimmed = name.trim().replace(/[\\/]+/g, "_");
  // Strip control chars / restrict to a sane allowlist
  const cleaned = trimmed.replace(/[^\w. \-()]+/g, "_");
  // Collapse repeats and trim leading dots so we never get a dotfile
  return cleaned.replace(/_+/g, "_").replace(/^\.+/, "").slice(0, 200);
}

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i + 1).toLowerCase();
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`career-resume:upload:${ip}`, {
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  const roleId = (form.get("role_id") ?? "").toString().trim();
  if (!roleId) {
    return NextResponse.json(
      { error: "role_id is required" },
      { status: 400 },
    );
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  const file = fileEntry;

  if (file.size <= 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 10 MB." },
      { status: 413 },
    );
  }

  const ext = fileExt(file.name);
  const declaredMime = (file.type || "").toLowerCase();
  // Trust either the declared mime or the extension. Browsers sometimes send
  // octet-stream for .docx — fall back to extension-based mapping.
  const isAllowedMime = declaredMime && ALLOWED_MIME.has(declaredMime);
  const isAllowedExt = ext && ALLOWED_EXT.has(ext);
  if (!isAllowedMime && !isAllowedExt) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Please upload a PDF (preferred), DOC or DOCX.",
      },
      { status: 415 },
    );
  }
  const finalMime = isAllowedMime
    ? declaredMime
    : EXT_TO_MIME[ext] ?? "application/octet-stream";

  let supabase;
  try {
    supabase = getAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Resume uploads are not configured.",
      },
      { status: 503 },
    );
  }

  // Verify role exists and is open. Service-role bypasses RLS so we do this
  // explicitly. (Defence in depth — a valid role id signals the upload is
  // meaningfully attached to a real apply flow.)
  const { data: role } = await supabase
    .from("hr_roles")
    .select("id, status")
    .eq("id", roleId)
    .eq("status", "open")
    .maybeSingle();
  if (!role) {
    return NextResponse.json(
      { error: "This role is no longer accepting applications." },
      { status: 400 },
    );
  }

  const safeName = sanitiseFilename(file.name) || `resume.${ext || "pdf"}`;
  const storagePath = `${roleId}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("hr-resumes")
    .upload(storagePath, buffer, {
      contentType: finalMime,
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json(
      { error: uploadErr.message ?? "Failed to upload file" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    path: storagePath,
    filename: safeName,
    mime: finalMime,
    size: file.size,
  });
}
