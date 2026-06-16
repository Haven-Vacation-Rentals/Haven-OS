import Link from "next/link";
import { getPublicCompensationFormBySlug } from "@/lib/hr/compensation";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { CompensationPublicForm } from "@/components/hr/compensation-public-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const form = await getPublicCompensationFormBySlug(slug);
    if (!form) return { title: "Sales Compensation — Haven Vacation Rentals" };
    return {
      title: `${form.title} — Haven Sales Compensation`,
      description:
        form.description ||
        "Log booked meetings and closed deals for Haven sales compensation.",
    };
  } catch {
    return { title: "Sales Compensation — Haven Vacation Rentals" };
  }
}

export default async function SalesCompensationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getPublicCompensationFormBySlug(slug);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/">
            <HavenWordmark />
          </Link>
          <span className="haven-eyebrow">Sales Compensation</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-8 sm:px-6 sm:py-16">
        {!form ? (
          <Unavailable
            title="Form not found"
            message="The link you followed does not match an active Haven sales compensation form."
          />
        ) : form.status !== "active" ? (
          <Unavailable
            title="Form unavailable"
            message={
              form.status === "draft"
                ? "This form is not open yet."
                : "This form is closed and no longer accepting responses."
            }
          />
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <h1 className="font-heading text-display-2 font-bold tracking-tight">
                {form.title}
              </h1>
              {form.description ? (
                <p className="text-[14px] text-muted-foreground">
                  {form.description}
                </p>
              ) : null}
            </header>
            <CompensationPublicForm form={form} />
          </>
        )}
      </main>
    </div>
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
