import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import {
  getDefaultSpace,
  getWordPressEnvStatus,
  listContentAssignees,
  listTopics,
} from "@/lib/content/actions";
import { TopicTracker } from "@/components/content/topic-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content Studio — Haven OS",
};

export default async function ContentStudioPage() {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const space = await getDefaultSpace();
  if (!space) {
    return (
      <div className="rounded-card border border-border bg-surface-alt/40 p-8 text-center">
        <h1 className="font-heading text-display-3 text-foreground">
          Content Studio
        </h1>
        <p className="mt-3 text-[13.5px] text-muted-foreground">
          The Haven Homeowner Blog space hasn't been provisioned. Run the
          0019 migration in Supabase to create it.
        </p>
      </div>
    );
  }

  const [topics, wp, assignees] = await Promise.all([
    listTopics(space.id),
    getWordPressEnvStatus(),
    listContentAssignees(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-4">
        <div>
          <div className="haven-eyebrow text-haven-coral">Content</div>
          <h1 className="font-heading text-display-3 text-foreground">
            {space.name}
          </h1>
          <p className="mt-1 max-w-3xl text-[13.5px] text-muted-foreground">
            Editorial pipeline for the Haven Homeowner Blog. Track topics
            from idea to publish, assign owners, watch deadlines, and push
            drafts to WordPress.
          </p>
        </div>
        <div className="flex flex-row md:flex-col flex-wrap items-start md:items-end gap-2">
          <div className="flex items-center gap-2 rounded-md border border-haven-coral/30 bg-accent-soft/40 px-3 py-2 text-[12px] text-haven-coral-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-semibold">Content Studio · v1</span>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
            <span>
              WordPress:{" "}
              <span className={wp.configured ? "text-emerald-600" : "text-amber-600"}>
                {wp.configured ? "configured" : "not configured"}
              </span>
            </span>
          </div>
        </div>
      </header>

      <TopicTracker space={space} topics={topics} assignees={assignees} />
    </div>
  );
}
