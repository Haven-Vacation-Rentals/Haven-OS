import Link from "next/link";
import { listPublicRoles } from "@/lib/hr/public";
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/lib/hr/types";
import { HavenWordmark } from "@/components/brand/haven-logo";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata = {
  title: "Careers — Haven Vacation Rentals",
  description: "Join the Haven team. Explore open roles in the Smokies.",
};

export default async function CareersIndexPage() {
  const roles = await listPublicRoles();

  return (
    <div className="min-h-dvh bg-background">
      <PublicHeader />
      <main className="mx-auto flex max-w-[1100px] flex-col gap-10 px-6 py-12 sm:py-20">
        <section className="flex flex-col items-start gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Join Haven
          </div>
          <h1 className="font-heading text-[40px] font-black leading-[1.05] tracking-tight sm:text-[56px]">
            Build the future of vacation rentals in the Smokies.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            We run full-service property management across East Tennessee. If you love hospitality,
            systems, and hard work — we want to meet you.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-[22px] font-bold">Open roles</h2>
          {roles.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-surface-alt/40 py-10 text-center text-muted-foreground">
              No open roles right now. Check back soon.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {roles.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/careers/${r.slug}` as never}
                    className="haven-card haven-card-hover flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-heading text-[17px] font-bold">{r.title}</div>
                      <div className="mt-0.5 text-[13px] text-muted-foreground">
                        {[r.department, r.location,
                          r.employment_type
                            ? EMPLOYMENT_TYPE_LABELS[r.employment_type as EmploymentType] ?? r.employment_type
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-accent">View role →</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-4">
        <HavenWordmark />
        <a
          href="https://havenvacationrentals.com"
          className="text-[12px] font-semibold text-muted-foreground hover:text-foreground"
        >
          havenvacationrentals.com →
        </a>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-alt/40">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-6 text-[12px] text-muted-foreground">
        <div>© {new Date().getFullYear()} Haven Vacation Rentals</div>
        <Link href="/careers" className="hover:text-foreground">
          All roles
        </Link>
      </div>
    </footer>
  );
}
