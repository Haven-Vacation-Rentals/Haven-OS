import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/user";
import { getPermissions } from "@/lib/auth/permissions";
import { listOwnTokens } from "@/lib/api-tokens/actions";
import { ApiTokensCard } from "@/components/settings/api-tokens-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API Tokens — Haven OS",
};

export default async function ApiTokensSettingsPage() {
  await requireUser();
  const [perm, tokens] = await Promise.all([
    getPermissions(),
    listOwnTokens(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div>
        <Link
          href={"/settings" as never}
          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Settings
        </Link>
      </div>
      <header>
        <h1 className="font-heading text-display-3 font-bold">
          Personal Access Tokens
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Create tokens for external agents and scripts to call the Haven OS
          API as you. Tokens inherit your existing role and permissions —
          they cannot do anything you can&apos;t do.
        </p>
      </header>

      <ApiTokensCard
        initialTokens={tokens}
        isSuperAdmin={perm.is_super_admin}
      />
    </div>
  );
}
