import Link from "next/link";
import { HavenLogo } from "@/components/brand/haven-logo";
import { TopographicBg } from "@/components/brand/topographic-bg";
import { Button } from "@/components/ui/button";

/**
 * Login page (stub).
 *
 * Real Google OAuth via Supabase lands when env vars are populated
 * (see .env.example). Wiring is a 10-line Server Action; holding
 * until the Supabase project exists.
 */
export default function LoginPage() {
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

          <Button variant="cta" className="w-full" disabled>
            Continue with Google
          </Button>

          <p className="mt-6 text-[12px] text-muted-foreground">
            Google auth wires up once Supabase env vars are set. See{" "}
            <code className="rounded bg-surface-alt px-1 py-0.5 text-[11px]">
              .env.example
            </code>
            .
          </p>

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
