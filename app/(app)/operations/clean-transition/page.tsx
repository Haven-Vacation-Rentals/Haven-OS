import { CleanTransitionView } from "@/components/clean-transitions/clean-transition-view";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/user";
import { getCleanTransitionData } from "@/lib/clean-transitions/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CleanTransitionPage() {
  await requireUser();
  const { submissions, counts, canReview } = await getCleanTransitionData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-display-3 font-bold tracking-tight">
            Clean Transition
          </h1>
          <p className="text-sm text-muted-foreground">
            New property cleaning details and price changes for approval
          </p>
        </div>
        <Link
          href="/clean-transition/intake"
          target="_blank"
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Share Intake Form
        </Link>
      </div>

      <CleanTransitionView
        submissions={submissions}
        counts={counts}
        canReview={canReview}
      />
    </div>
  );
}
