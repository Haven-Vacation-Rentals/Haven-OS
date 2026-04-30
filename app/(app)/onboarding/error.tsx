"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function OnboardingError({
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
      title="Couldn't load Onboarding"
      description="Onboarding data didn't come back from the server. Try again."
    />
  );
}
