import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import {
  getDefaultSpace,
  listContentAssignees,
  listTopics,
} from "@/lib/content/actions";
import { TopicTracker } from "@/components/content/topic-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paid Advertising — Haven OS",
};

export default async function ContentStudioPage() {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const space = await getDefaultSpace();
  if (!space) {
    return (
      <div className="rounded-card border border-border bg-surface-alt/40 p-8 text-center">
        <h1 className="font-heading text-display-3 text-foreground">
          Paid Advertising
        </h1>
        <p className="mt-3 text-[13.5px] text-muted-foreground">
          The Paid Advertising space hasn't been provisioned. Run the
          0045 migration in Supabase to create it.
        </p>
      </div>
    );
  }

  const [topics, assignees] = await Promise.all([
    listTopics(space.id),
    listContentAssignees(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-4">
        <div>
          <div className="haven-eyebrow text-haven-coral">Paid Ads</div>
          <h1 className="font-heading text-display-3 text-foreground">
            {space.name}
          </h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-muted-foreground">
            Project space for paid advertising. Capture ideas, write and
            customize ad scripts, and move each one across Idea → In
            Progress → Draft → Complete on the way to launch.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-haven-coral/30 bg-accent-soft/40 px-3 py-2 text-[12px] text-haven-coral-700">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="font-semibold">Paid Ads · v1</span>
        </div>
      </header>

      <TopicTracker space={space} topics={topics} assignees={assignees} />
    </div>
  );
}
