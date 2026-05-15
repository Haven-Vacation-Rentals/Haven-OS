/**
 * MCP OAuth consent screen.
 *
 * Reached only after /api/mcp/oauth/authorize has validated the
 * client_id, redirect_uri, PKCE challenge, and produced a signed
 * `ck` state token. We re-verify that token here, gate on auth, and
 * render the approve / deny form. The form POSTs to
 * /api/mcp/oauth/authorize/decision.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/user";
import { verifyConsentState } from "@/lib/mcp/oauth/secret";
import { loadClient } from "@/lib/mcp/oauth/store";
import { MCP_OAUTH_SCOPE_DESCRIPTIONS } from "@/lib/mcp/oauth/scopes";
import type { ApiScope } from "@/lib/api-tokens/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorize connector — Haven OS",
};

export default async function McpConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ ck?: string }>;
}) {
  const { ck } = await searchParams;
  if (!ck) return renderError("Missing consent token. Restart the connector setup from Claude.");

  const payload = verifyConsentState(ck);
  if (!payload) {
    return renderError(
      "Consent request expired or invalid. Restart the connector setup from Claude.",
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    const next = `/mcp/consent?ck=${encodeURIComponent(ck)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const client = await loadClient(payload.c);
  if (!client || client.revoked_at) {
    return renderError("This connector is no longer registered. Please re-add it in Claude.");
  }

  const clientLabel = client.client_name?.trim() || "Claude";
  const scopes = payload.s as ApiScope[];

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-foreground/5 p-3">
          <ShieldCheck className="h-7 w-7 text-foreground/70" aria-hidden />
        </div>
        <h1 className="font-heading text-display-3 font-bold">
          Authorize {clientLabel}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {clientLabel} is requesting access to Haven OS on behalf of{" "}
          <strong className="text-foreground">{user.email}</strong>.
        </p>
      </header>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Requested permissions
        </h2>
        <ul className="flex flex-col gap-2.5">
          {scopes.map((s) => (
            <li key={s} className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF564E]" />
              <div>
                <div className="font-medium">{s}</div>
                <div className="text-[12px] text-muted-foreground">
                  {MCP_OAUTH_SCOPE_DESCRIPTIONS[s] ?? "—"}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This connector acts as you — it can never do anything you couldn&rsquo;t do
            in Haven OS yourself. You can revoke it anytime from{" "}
            <Link href={"/settings/api-tokens" as never} className="underline">
              Settings
            </Link>
            .
          </span>
        </div>
      </section>

      <form
        action="/api/mcp/oauth/authorize/decision"
        method="POST"
        className="flex flex-col gap-3 sm:flex-row-reverse"
      >
        <input type="hidden" name="ck" value={ck} />
        <button
          type="submit"
          name="decision"
          value="approve"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-foreground px-5 font-heading text-[13px] font-bold uppercase tracking-[2px] text-background transition-opacity hover:opacity-90"
        >
          Allow access
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface px-5 font-heading text-[13px] font-bold uppercase tracking-[2px] text-foreground transition-colors hover:bg-surface-alt"
        >
          Deny
        </button>
      </form>

      <p className="text-center text-[11px] text-muted-foreground">
        Redirects back to{" "}
        <span className="font-mono">{new URL(payload.r).host}</span> when complete.
      </p>
    </div>
  );
}

function renderError(message: string) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="rounded-full bg-rose-500/10 p-3">
        <AlertCircle className="h-7 w-7 text-rose-500" aria-hidden />
      </div>
      <h1 className="font-heading text-[20px] font-bold">Connector authorization failed</h1>
      <p className="text-[13px] text-muted-foreground">{message}</p>
      <Link
        href={"/dashboard" as never}
        className="text-[12px] text-foreground underline hover:no-underline"
      >
        Back to Haven OS
      </Link>
    </div>
  );
}
