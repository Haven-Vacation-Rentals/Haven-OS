import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { HavenLogo } from "@/components/brand/haven-logo";
import { TopographicBg } from "@/components/brand/topographic-bg";
import { GoogleSignInButton } from "./google-sign-in";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth/user";
import { redirect } from "next/navigation";

const CORE_VALUES = [
  "Faithful Stewardship",
  "Excellence",
  "Humility",
  "Teamwork",
  "Continuous Improvement",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next: nextParam } = await searchParams;
  const next = sanitizeLoginNext(nextParam);

  const user = await getCurrentUser();
  if (user) redirect(next ?? "/dashboard");

  const configured = isSupabaseConfigured();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-foreground text-background">
      <TopographicBg className="text-background" />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-xl">
          {/* Brand mark + headline */}
          <div className="flex flex-col items-center text-center">
            <HavenLogo size={120} variant="cream" />

            <h1 className="mt-6 font-heading text-[34px] font-black leading-[1.15] tracking-tight text-white sm:text-[40px]">
              The operating system
              <br />
              for Haven.
            </h1>
            <p className="mt-3 max-w-md text-sm text-background/75">
              Every cabin, every task, every owner — in one place.
            </p>
          </div>

          {/* Sign-in card */}
          <div className="mx-auto mt-10 w-full max-w-sm rounded-2xl border border-background/10 bg-background/[0.04] p-6 backdrop-blur-sm">
            <div className="mb-1 text-center text-[11px] font-bold uppercase tracking-[3px] text-[#FF564E]">
              Sign in
            </div>
            <p className="mb-5 text-center text-[13px] text-background/70">
              Internal access only. Use your Haven Google account.
            </p>

            {!configured ? <NotConfiguredBanner /> : null}

            {error ? (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error === "missing_code"
                    ? "Sign-in didn't complete. Please try again."
                    : error === "not_configured"
                      ? "Supabase is not configured yet."
                      : error === "auth_session_expired"
                        ? "Your sign-in session expired. We've cleared it — please try again."
                        : decodeURIComponent(error)}
                </span>
              </div>
            ) : null}

            <GoogleSignInButton disabled={!configured} next={next ?? undefined} />

            <div className="mt-5 text-center text-[11px] text-background/55">
              <Link href="/dashboard" className="hover:text-[#FF564E]">
                Skip to demo dashboard →
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-auto mt-12 h-px w-24 bg-background/15" />

          {/* Core values */}
          <div className="mt-8 text-center">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-[#FF564E]">
              Core Values
            </div>
            <ul className="flex flex-wrap justify-center gap-2">
              {CORE_VALUES.map((value) => (
                <li
                  key={value}
                  className="rounded-full border border-background/20 bg-background/5 px-3.5 py-1.5 text-[12px] font-medium text-background/90"
                >
                  {value}
                </li>
              ))}
            </ul>
          </div>

          {/* Scripture */}
          <figure className="mx-auto mt-10 max-w-lg text-center">
            <blockquote className="text-[13px] leading-relaxed text-background/75">
              <p>
                <sup className="mr-0.5 text-[10px] text-[#FF564E]">13</sup>
                Come now, you who say, &ldquo;Today or tomorrow we will go into
                such and such a town and spend a year there and trade and make
                a profit&rdquo;—{" "}
                <sup className="mx-0.5 text-[10px] text-[#FF564E]">14</sup>
                yet you do not know what tomorrow will bring. What is your
                life? For you are a mist that appears for a little time and
                then vanishes.{" "}
                <sup className="mx-0.5 text-[10px] text-[#FF564E]">15</sup>
                Instead you ought to say, &ldquo;If the Lord wills, we will
                live and do this or that.&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-4 text-[11px] font-bold uppercase tracking-[2px] text-background/55">
              James 4:13–15 · ESV
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}

function sanitizeLoginNext(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  return raw;
}

function NotConfiguredBanner() {
  return (
    <div className="mb-4 rounded-md border border-amber-300/40 bg-amber-500/10 p-3 text-[12px] text-amber-100">
      <div className="mb-1 flex items-center gap-2 font-heading font-bold">
        <AlertCircle className="h-4 w-4" /> Supabase not configured
      </div>
      <p className="mb-2 text-amber-100/90">
        Add these to <code className="rounded bg-amber-500/20 px-1 py-0.5 text-[11px]">.env.local</code> and restart:
      </p>
      <pre className="overflow-x-auto rounded bg-amber-500/15 p-2 font-mono text-[10px]">
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY</pre>
    </div>
  );
}
