"use client";

import { useTransition } from "react";
import { signInWithGoogle } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Google sign-in button. Uses a Server Action so we never ship the
 * Supabase auth call through a client-exposed API route.
 *
 * `variant="cta"` matches the havenvacationrentals.com button spec
 * exactly: pill / uppercase / 2px tracking / 900 weight.
 */
export function GoogleSignInButton({
  disabled,
  next,
}: {
  disabled?: boolean;
  next?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          await signInWithGoogle(formData);
        });
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button
        type="submit"
        variant="cta"
        className="w-full"
        disabled={disabled || pending}
      >
        <GoogleGlyph />
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
    </form>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#fff"
        d="M44.5 20H24v8.5h11.8C34.7 33 29.8 36.5 24 36.5c-6.9 0-12.5-5.6-12.5-12.5S17.1 11.5 24 11.5c3.1 0 6 1.1 8.2 3l6-6C34.6 5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 21-17.5 0-1.3.2-2.5.2-3.8 0-1.3-.2-2.5-.2-3.8z"
      />
    </svg>
  );
}
