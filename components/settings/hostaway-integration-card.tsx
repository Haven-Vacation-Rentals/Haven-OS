"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, PlugZap } from "lucide-react";
import { testHostawayConnection, type TestConnectionResult } from "@/lib/hostaway/actions";
import { cn } from "@/lib/utils";

/**
 * Settings → Integrations → Hostaway card.
 *
 * Credentials are managed as Vercel env vars (HOSTAWAY_ACCOUNT_ID,
 * HOSTAWAY_API_KEY) — this card just shows whether they're configured
 * and offers a live connection test.
 */
export function HostawayIntegrationCard({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const runTest = () => {
    setResult(null);
    startTransition(async () => {
      const r = await testHostawayConnection();
      setResult(r);
    });
  };

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-accent/10 text-accent">
            <PlugZap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-[15px] font-bold leading-tight">
              Hostaway
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Powers the reservations, reviews, and financial tiles on the dashboard.
            </p>
          </div>
        </div>

        <StatusPill configured={configured} result={result} pending={pending} />
      </div>

      <dl className="grid grid-cols-[160px_1fr] gap-y-3 text-[13px]">
        <dt className="text-muted-foreground">Account ID</dt>
        <dd className="font-mono text-[12px] text-foreground/70">
          {configured ? "HOSTAWAY_ACCOUNT_ID ✓" : "not set"}
        </dd>

        <dt className="text-muted-foreground">API Key</dt>
        <dd className="font-mono text-[12px] text-foreground/70">
          {configured ? "HOSTAWAY_API_KEY ✓" : "not set"}
        </dd>

        <dt className="text-muted-foreground">Managed via</dt>
        <dd className="text-[12px] text-foreground/70">
          Vercel environment variables
        </dd>
      </dl>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={runTest}
          disabled={pending || !configured}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-[13px] font-medium",
            "transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlugZap className="h-3.5 w-3.5" />
          )}
          {pending ? "Testing…" : "Test connection"}
        </button>

        {!configured && (
          <span className="text-[12px] text-muted-foreground">
            Set env vars in Vercel to enable.
          </span>
        )}
      </div>

      {result && !result.ok && (
        <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[12px] text-rose-600">
          <span className="font-medium">Connection failed:</span> {result.error}
        </p>
      )}
      {result && result.ok && (
        <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-600">
          <span className="font-medium">Connected.</span> Token {result.tokenPreview}
        </p>
      )}
    </section>
  );
}

function StatusPill({
  configured,
  result,
  pending,
}: {
  configured: boolean;
  result: TestConnectionResult | null;
  pending: boolean;
}) {
  if (pending) {
    return (
      <Pill tone="neutral">
        <Loader2 className="h-3 w-3 animate-spin" /> Testing
      </Pill>
    );
  }
  if (result?.ok) {
    return (
      <Pill tone="success">
        <CheckCircle2 className="h-3 w-3" /> Connected
      </Pill>
    );
  }
  if (result && !result.ok) {
    return (
      <Pill tone="error">
        <XCircle className="h-3 w-3" /> Error
      </Pill>
    );
  }
  if (configured) {
    return (
      <Pill tone="success">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </Pill>
    );
  }
  return (
    <Pill tone="muted">
      <XCircle className="h-3 w-3" /> Not configured
    </Pill>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error" | "neutral" | "muted";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : tone === "error"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
        : tone === "neutral"
          ? "border-border bg-surface-alt text-foreground/70"
          : "border-border bg-surface-alt text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium",
        styles,
      )}
    >
      {children}
    </span>
  );
}
