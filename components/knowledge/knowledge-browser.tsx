"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeArticle, KnowledgeCategory } from "@/lib/knowledge/data";

export function KnowledgeBrowser({
  articles,
  categories,
}: {
  articles: readonly KnowledgeArticle[];
  categories: readonly KnowledgeCategory[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "all" || article.categorySlug === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        article.title,
        article.summary,
        article.categorySlug,
        ...article.tags,
        ...article.sections.flatMap((section) => [
          section.heading,
          ...(section.body ?? []),
          ...(section.bullets ?? []),
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [activeCategory, articles, query]);

  const groupedArticles = categories
    .map((category) => ({
      category,
      articles: filteredArticles.filter(
        (article) => article.categorySlug === category.slug,
      ),
    }))
    .filter((group) => group.articles.length > 0);

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search owner articles"
            className="h-11 w-full rounded-card border border-border bg-surface pl-9 pr-10 text-[14px] outline-none transition focus:border-accent focus:shadow-ring"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav aria-label="Knowledge categories" className="flex flex-wrap gap-2 lg:flex-col">
          <CategoryButton
            active={activeCategory === "all"}
            label="All articles"
            count={articles.length}
            onClick={() => setActiveCategory("all")}
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.slug}
              active={activeCategory === category.slug}
              label={category.title}
              count={
                articles.filter((article) => article.categorySlug === category.slug)
                  .length
              }
              onClick={() => setActiveCategory(category.slug)}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {groupedArticles.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface-alt/40 p-8 text-center">
            <h2 className="font-heading text-[22px] font-bold">No articles found</h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Try a different search term or clear the selected category.
            </p>
          </div>
        ) : (
          groupedArticles.map(({ category, articles: categoryArticles }) => (
            <section key={category.slug} className="flex flex-col gap-3">
              <div>
                <h2 className="font-heading text-[24px] font-black">
                  {category.title}
                </h2>
                <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {categoryArticles.map((article) => (
                  <ArticleCard
                    key={article.slug}
                    article={article}
                    categoryTitle={category.title}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

function CategoryButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-between gap-3 rounded-card border px-3 py-2 text-left text-[13px] font-bold transition",
        active
          ? "border-accent bg-accent text-accent-foreground shadow-card"
          : "border-border bg-surface text-foreground hover:border-accent/40 hover:bg-surface-alt/60",
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px]",
          active ? "bg-white/20 text-accent-foreground" : "bg-surface-alt text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ArticleCard({
  article,
  categoryTitle,
}: {
  article: KnowledgeArticle;
  categoryTitle: string;
}) {
  return (
    <Link
      href={`/knowledge/${article.slug}` as never}
      className="haven-card haven-card-hover group flex min-h-[190px] flex-col justify-between gap-5 p-5"
    >
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          {categoryTitle}
        </div>
        <h3 className="mt-2 font-heading text-[19px] font-black leading-tight group-hover:text-accent">
          {article.title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {article.summary}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="haven-chip">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
