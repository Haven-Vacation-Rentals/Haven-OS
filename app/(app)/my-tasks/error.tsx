"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function MyTasksError({
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
      title="Couldn't load My Tasks"
      description="Your task inbox didn't come back from the server. Try again."
    />
  );
}
