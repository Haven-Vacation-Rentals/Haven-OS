"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function AgentsError({
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
      title="Couldn't load Agents"
      description="The agent registry didn't come back from the server. Try again."
    />
  );
}
