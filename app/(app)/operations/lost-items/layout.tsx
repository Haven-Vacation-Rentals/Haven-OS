import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { PackageSearch } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * /operations/lost-items — Operations module: cleaning / left-behind items
 * tracker. Open to any signed-in Haven user.
 */
export default async function LostItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Operations
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-soft">
            <PackageSearch className="h-5 w-5 text-haven-coral-700" />
          </div>
          <div>
            <h1 className="font-heading text-display-2 font-bold tracking-tight">
              Lost Items
            </h1>
            <p className="text-sm text-muted-foreground">
              Items guests left at properties — intake, pickup, return, completion.
            </p>
          </div>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
