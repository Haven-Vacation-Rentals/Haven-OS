import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { KnowledgeBrowser } from "@/components/knowledge/knowledge-browser";
import { knowledgeArticles, knowledgeCategories } from "@/lib/knowledge/data";

export const metadata = {
  title: "Haven Knowledge Base",
  description:
    "Public owner resources for Haven Vacation Rentals onboarding, pricing, payments, maintenance, and owner stays.",
};

export default function KnowledgeIndexPage() {
  const popularArticles = knowledgeArticles.filter((article) => article.popular);

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="mx-auto flex max-w-[1120px] flex-col gap-10 px-4 py-8 sm:px-6 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="flex flex-col items-start gap-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Owner resources
            </div>
            <h1 className="max-w-4xl font-heading text-[38px] font-black leading-[1.02] tracking-tight sm:text-[60px]">
              Haven Knowledge Base
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Search practical guides for onboarding, pricing, owner payouts,
              maintenance approvals, cleaning expectations, and other common
              Haven owner questions.
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface-alt/50 p-5">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <LifeBuoy className="h-4 w-4 text-accent" />
              Need help?
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">
              For account-specific questions, contact your Haven account manager
              or reach the owner relations team through the main Haven site.
            </p>
            <a
              href="https://havenvacationrentals.com"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:text-foreground"
            >
              Visit Haven Vacation Rentals
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-heading text-[24px] font-black">
              Popular owner questions
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Start here for the questions most owners ask during onboarding and
              early operations.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularArticles.slice(0, 8).map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}` as never}
                className="haven-card haven-card-hover flex min-h-[150px] flex-col justify-between gap-4 p-4"
              >
                <div>
                  <h3 className="font-heading text-[17px] font-black leading-tight">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {article.summary}
                  </p>
                </div>
                <span className="text-[12px] font-bold text-accent">Read article</span>
              </Link>
            ))}
          </div>
        </section>

        <KnowledgeBrowser
          articles={knowledgeArticles}
          categories={knowledgeCategories}
        />
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
        <a
          href="https://havenvacationrentals.com"
          className="truncate text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <span className="hidden sm:inline">havenvacationrentals.com</span>
          <span className="sm:hidden">Haven</span>
        </a>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-2 px-4 py-6 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div>&copy; {new Date().getFullYear()} Haven Vacation Rentals</div>
        <a href="https://havenvacationrentals.com" className="hover:text-foreground">
          havenvacationrentals.com
        </a>
      </div>
    </footer>
  );
}
