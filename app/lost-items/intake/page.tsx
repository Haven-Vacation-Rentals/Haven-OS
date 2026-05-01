import { HavenLogo } from "@/components/brand/haven-logo";
import { LostItemPublicIntakeForm } from "@/components/lost-items/lost-item-public-intake-form";

export const dynamic = "force-dynamic";

export default function LostItemsIntakePage() {
  return (
    <div className="min-h-dvh bg-haven-white">
      <header className="border-b border-border/60 bg-haven-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <HavenLogo size={48} />
          <div className="leading-tight">
            <div className="font-heading text-lg font-bold text-haven-charcoal">
              Haven Vacation Rentals
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Lost &amp; Found Intake
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-haven-charcoal">
            Report a lost item
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use this form to log a guest&apos;s lost or left-behind item with
            the Haven operations team. We&apos;ll open a case and follow up
            from <span className="font-medium">Pending Pickup</span> through
            return.
          </p>
        </div>

        <LostItemPublicIntakeForm />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Internal tool · only share this link with Haven team members and
          trusted partners.
        </p>
      </main>
    </div>
  );
}
