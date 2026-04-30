"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Couldn't load Settings"
      description="Settings didn't come back from the server. Try again."
    />
  );
}
