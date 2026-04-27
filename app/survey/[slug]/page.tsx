import Link from "next/link";
import { getPublicSurveyBySlug } from "@/lib/hr/surveys";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { SurveyForm } from "@/components/hr/survey-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const view = await getPublicSurveyBySlug(slug);
    if (!view) return { title: "Survey — Haven Vacation Rentals" };
    return {
      title: `${view.survey.title} — Haven Survey`,
      description:
        view.survey.description || `Share your feedback with Haven.`,
    };
  } catch {
    return { title: "Survey — Haven Vacation Rentals" };
  }
}

export default async function SurveyLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await getPublicSurveyBySlug(slug);

  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 py-10 sm:py-16">
        {!view ? (
          <Unavailable
            title="Survey not found"
            message="The link you followed doesn't match an active Haven survey."
          />
        ) : view.survey.status !== "active" ? (
          <Unavailable
            title="Survey unavailable"
            message={
              view.survey.status === "draft"
                ? "This survey isn't open yet. Check back soon."
                : "This survey is closed and no longer accepting responses."
            }
          />
        ) : view.questions.length === 0 ? (
          <Unavailable
            title="Survey not ready"
            message="This survey is active but doesn't have any questions yet."
          />
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <h1 className="font-heading text-display-2 font-bold tracking-tight">
                {view.survey.title}
              </h1>
              {view.survey.description ? (
                <p className="text-[14px] text-muted-foreground">
                  {view.survey.description}
                </p>
              ) : null}
              {view.survey.instructions ? (
                <div className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-surface-alt/40 p-3 text-[13px] text-foreground/80">
                  {view.survey.instructions}
                </div>
              ) : null}
            </header>
            <SurveyForm
              survey={view.survey}
              questions={view.questions}
            />
          </>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link href="/">
          <HavenWordmark />
        </Link>
        <span className="haven-eyebrow">Team Survey</span>
      </div>
    </header>
  );
}

function Unavailable({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface-alt/40 px-6 py-12 text-center">
      <h2 className="font-heading text-[22px] font-bold">{title}</h2>
      <p className="max-w-[420px] text-[14px] text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
