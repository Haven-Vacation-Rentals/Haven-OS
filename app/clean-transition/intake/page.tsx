import { HavenLogo } from "@/components/brand/haven-logo";
import { CleanTransitionPublicIntakeForm } from "@/components/clean-transitions/clean-transition-public-intake-form";

export const dynamic = "force-dynamic";

export default function CleanTransitionIntakePage() {
  return (
    <div className="min-h-dvh bg-haven-white">
      <header className="border-b border-border/60 bg-haven-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <HavenLogo size={48} />
          <div className="leading-tight">
            <div className="font-heading text-lg font-bold text-haven-charcoal">
              Haven Vacation Rentals
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Clean Transition Intake
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-haven-charcoal">
            Submit a clean transition
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use this form to send new property details and cleaning price
            changes into Haven OS for approval.
          </p>
        </div>

        <CleanTransitionPublicIntakeForm />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Internal tool · only share this link with Haven team members and
          trusted partners.
        </p>
      </main>
    </div>
  );
}
