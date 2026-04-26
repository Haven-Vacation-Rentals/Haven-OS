import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canAccessSales } from "@/lib/auth/permissions";
import {
  getTopic,
  listAgentMessages,
  listResearch,
  getLatestScores,
  listPublishJobs,
  getWordPressEnvStatus,
} from "@/lib/content/actions";
import { ArticleWorkspace } from "@/components/content/article-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Article — Content Studio — Haven OS",
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

  const [messages, sources, scores, jobs, wp] = await Promise.all([
    listAgentMessages(topic.article.id),
    listResearch(topicId),
    getLatestScores(topic.article.id),
    listPublishJobs(topic.article.id),
    getWordPressEnvStatus(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/content"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Content Studio
        </Link>
      </div>
      <ArticleWorkspace
        topic={topic}
        article={topic.article}
        messages={messages}
        sources={sources}
        seo={scores.seo}
        geo={scores.geo}
        jobs={jobs}
        wpConfigured={wp.configured}
      />
    </div>
  );
}
