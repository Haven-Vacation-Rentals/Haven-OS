import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { HavenWordmark } from "@/components/brand/haven-logo";
import {
  getKnowledgeArticle,
  getKnowledgeCategory,
  getRelatedKnowledgeArticles,
  knowledgeArticles,
} from "@/lib/knowledge/data";

export function generateStaticParams() {
  return knowledgeArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getKnowledgeArticle(slug);

  if (!article) {
    return {
      title: "Knowledge Base - Haven Vacation Rentals",
    };
  }

  return {
    title: `${article.title} - Haven Knowledge Base`,
    description: article.summary,
  };
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getKnowledgeArticle(slug);
  if (!article) notFound();

  const category = getKnowledgeCategory(article.categorySlug);
  if (!category) notFound();

  const relatedArticles = getRelatedKnowledgeArticles(article).slice(0, 3);

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="mx-auto grid max-w-[1120px] gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,720px)_320px] lg:items-start">
        <article className="min-w-0">
          <Link
            href="/knowledge"
            className="mb-7 inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Knowledge base
          </Link>

          <header className="border-b border-border pb-7">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
              {category.title}
            </div>
            <h1 className="mt-3 font-heading text-[34px] font-black leading-[1.05] tracking-tight sm:text-[52px]">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {article.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="haven-chip">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="flex flex-col gap-8 py-8">
            {article.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-3">
                <h2 className="font-heading text-[24px] font-black leading-tight">
                  {section.heading}
                </h2>
                {section.body?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-[15px] leading-7 text-foreground/90"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="ml-5 list-disc space-y-2 text-[15px] leading-7 text-foreground/90 marker:text-accent">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className="rounded-card border border-border bg-surface-alt/45 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Source reference
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              This article was adapted from the previous Haven HubSpot knowledge
              base and cleaned for public owner access.
            </p>
            <a
              href={article.sourceUrl}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:text-foreground"
            >
              Original source
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </section>

          <section className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Related articles
            </div>
            {relatedArticles.length > 0 ? (
              <div className="mt-4 flex flex-col divide-y divide-border">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/knowledge/${related.slug}` as never}
                    className="group flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-[14px] font-bold leading-snug group-hover:text-accent">
                      {related.title}
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-muted-foreground">
                Browse the full knowledge base for more owner resources.
              </p>
            )}
          </section>

          <section className="rounded-card border border-accent/25 bg-accent-soft/45 p-5">
            <h2 className="font-heading text-[20px] font-black">Need more help?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground/80">
              For account-specific questions, contact your account manager or
              use Haven's public site to reach the team.
            </p>
            <a
              href="https://havenvacationrentals.com"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:text-foreground"
            >
              Contact Haven
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </section>
        </aside>
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/knowledge" className="shrink-0">
          <HavenWordmark />
        </Link>
        <Link
          href="/knowledge"
          className="truncate text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          Knowledge base
        </Link>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-2 px-4 py-6 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div>&copy; {new Date().getFullYear()} Haven Vacation Rentals</div>
        <Link href="/knowledge" className="hover:text-foreground">
          All knowledge articles
        </Link>
      </div>
    </footer>
  );
}
