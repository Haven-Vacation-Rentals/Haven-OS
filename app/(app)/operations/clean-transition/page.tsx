import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The Clean Transition review page moved under the Onboarding space.
// Keep the old Operations path working for any bookmarked/shared links.
export default function LegacyCleanTransitionRedirect() {
  redirect("/onboarding/clean-transition");
}
