import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublicRoleBySlug, getPublicRoleQuestions } from "@/lib/hr/public";
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/lib/hr/types";
import { renderAnnouncementBody } from "@/lib/board/markdown";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { ApplyForm } from "@/components/hr/apply-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = await getPublicRoleBySlug(slug);
  if (!role) return { title: "Careers — Haven Vacation Rentals" };
  return {
    title: `${role.title} — Haven Careers`,
    description: `Apply for ${role.title} at Haven Vacation Rentals.`,
  };
}

export default async function RoleLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = await getPublicRoleBySlug(slug);
  if (!role) notFound();

  const questions = await getPublicRoleQuestions(role.id);

  const meta = [
    role.department,
    role.location,
    role.employment_type
      ? EMPLOYMENT_TYPE_LABELS[role.employment_type as EmploymentType] ?? role.employment_type
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main className="mx-auto flex max-w-[900px] flex-col gap-8 px-6 py-10 sm:py-16">
        <Link
          href="/careers"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All open roles
        </Link>

        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            We're hiring
          </div>
          <h1 className="font-heading text-[40px] font-black leading-[1.05] tracking-tight sm:text-[48px]">
            {role.title}
          </h1>
          {meta && <div className="text-[14px] text-muted-foreground">{meta}</div>}
        </header>

        {role.description && (
          <Section title="About the role" body={role.description} />
        )}
        {role.responsibilities && (
          <Section title="What you'll do" body={role.responsibilities} />
        )}
        {role.perks && <Section title="Why Haven" body={role.perks} />}

        <section id="apply" className="flex flex-col gap-3 rounded-card border border-border bg-surface-alt/40 p-6">
          <h2 className="font-heading text-[22px] font-bold">Apply</h2>
          <p className="text-[13px] text-muted-foreground">
            Tell us a bit about yourself and we'll be in touch.
          </p>
          <ApplyForm roleId={role.id} roleSlug={role.slug} questions={questions} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-[20px] font-bold">{title}</h2>
      <div
        className="haven-prose flex flex-col gap-3 text-[15px] leading-relaxed text-foreground/90"
        dangerouslySetInnerHTML={{ __html: renderAnnouncementBody(body) }}
      />
    </section>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
        <HavenWordmark />
        <a
          href="#apply"
          className="rounded-pill bg-accent px-4 py-1.5 text-[12px] font-black uppercase tracking-cta text-accent-foreground hover:brightness-95"
        >
          Apply now
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-6 text-[12px] text-muted-foreground">
        <div>© {new Date().getFullYear()} Haven Vacation Rentals</div>
        <Link href="/careers" className="hover:text-foreground">
          All open roles
        </Link>
      </div>
    </footer>
  );
}
