import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import {
  getTopic,
  listContentAssignees,
} from "@/lib/content/actions";
import { ArticleWorkspace } from "@/components/content/article-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ad — Paid Advertising — Haven OS",
};

export default async function ArticleWorkspacePage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const allowed = await canAccessSales();
  if (!allowed) redirect("/dashboard");

  const { topicId } = await params;
  const topic = await getTopic(topicId);
  if (!topic || !topic.article) notFound();

  const assignees = await listContentAssignees();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/content"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Paid Advertising
        </Link>
      </div>
      <ArticleWorkspace
        topic={topic}
        article={topic.article}
        assignees={assignees}
      />
    </div>
  );
}
