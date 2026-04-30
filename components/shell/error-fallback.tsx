"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable error UI for `error.tsx` boundaries. Logs the error so it
 * shows up in browser/console/Sentry, and offers a one-click retry that
 * calls Next's `reset()`.
 */
export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "We hit an error loading this page. Try again, or refresh if the problem persists.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-border bg-surface-alt/40 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        <p className="max-w-md text-[13px] text-muted-foreground">{description}</p>
        {error.digest ? (
          <p className="font-mono text-[10px] text-muted-foreground/60">
            ref {error.digest}
          </p>
        ) : null}
      </div>
      <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" /> Try again
      </Button>
    </div>
  );
}
