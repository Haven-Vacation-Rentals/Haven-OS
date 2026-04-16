import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { HavenLogo } from "@/components/brand/haven-logo";
import { TopographicBg } from "@/components/brand/topographic-bg";
import { GoogleSignInButton } from "./google-sign-in";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Go straight through.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const configured = isSupabaseConfigured();
  const { error } = await searchParams;

  return (
    <div className="relative grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Left hero */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-foreground text-background lg:flex">
        <TopographicBg className="text-background" />
        <div className="relative z-10 flex flex-col items-center gap-6 p-12 text-center">
          <HavenLogo size={160} className="text-background" />
          <div>
            <h1 className="font-heading text-display-1 font-bold leading-tight">
              The operating system
              <br />
              for Haven.
            </h1>
            <p className="mt-3 max-w-sm text-sm text-background/70">
              Every cabin, every task, every owner — in one place. Built for
              the team, with an assistant that actually helps.
            </p>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-center lg:hidden">
            <HavenLogo size={96} />
          </div>

          <div className="haven-eyebrow mb-2">Sign in</div>
          <h2 className="mb-2 font-heading text-display-3 font-bold">
            Welcome back
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Internal access only. Use your Haven Google account.
          </p>

          {!configured ? <NotConfiguredBanner /> : null}

          {error ? (
            <div className="mb-6 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {error === "missing_code"
                  ? "Sign-in didn't complete. Please try again."
                  : error === "not_configured"
                    ? "Supabase is not configured yet."
                    : decodeURIComponent(error)}
              </span>
            </div>
          ) : null}

          <GoogleSignInButton disabled={!configured} />

          <div className="mt-10 text-center text-[12px] text-muted-foreground">
            <Link href="/dashboard" className="text-accent hover:underline">
              Skip to demo dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotConfiguredBanner() {
  return (
    <div className="mb-6 rounded-card border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="mb-1 flex items-center gap-2 font-heading font-bold">
        <AlertCircle className="h-4 w-4" /> Supabase not configured
      </div>
      <p className="mb-2 text-amber-900/90 dark:text-amber-200/90">
        Add these to <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] dark:bg-amber-500/20">.env.local</code> and restart:
      </p>
      <pre className="overflow-x-auto rounded bg-amber-100/60 p-2 font-mono text-[11px] dark:bg-amber-500/15">
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY</pre>
      <p className="mt-2 text-[12px] text-amber-900/80 dark:text-amber-200/80">
        See <code className="text-[11px]">README.md § Supabase setup</code>.
      </p>
    </div>
  );
}
