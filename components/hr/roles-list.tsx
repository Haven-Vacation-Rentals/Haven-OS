"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleEditor } from "./role-editor";
import { ROLE_STATUS_LABELS, type DbRole, type RoleStatus } from "@/lib/hr/types";

const STATUS_TONE: Record<RoleStatus, "neutral" | "success" | "warn"> = {
  draft: "neutral",
  open: "success",
  closed: "warn",
};

export function RolesList({ roles }: { roles: DbRole[] }) {
  const [newOpen, setNewOpen] = useState(false);

  const byStatus: Record<string, DbRole[]> = { open: [], draft: [], closed: [] };
  for (const r of roles) {
    (byStatus[r.status] ??= []).push(r);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-[18px] font-bold">Roles</h2>
          <p className="text-sm text-muted-foreground">
            Open roles appear on the public careers page.
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New role
        </Button>
      </div>

      {roles.length === 0 ? (
        <EmptyState onAdd={() => setNewOpen(true)} />
      ) : (
        <>
          {(["open", "draft", "closed"] as const).map((status) => {
            const list = byStatus[status] ?? [];
            if (list.length === 0) return null;
            return (
              <section key={status} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[14px] font-bold capitalize">
                    {ROLE_STATUS_LABELS[status]}
                  </h3>
                  <span className="text-[12px] text-muted-foreground">{list.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((r) => (
                    <RoleRow key={r.id} role={r} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      <RoleEditor open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function RoleRow({ role }: { role: DbRole }) {
  const status = role.status as RoleStatus;
  const tone = STATUS_TONE[status] ?? "neutral";

  return (
    <Link
      href={`/hr/hiring/${role.id}` as never}
      className="haven-card haven-card-hover flex items-center gap-4 p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-haven-coral-700 dark:text-haven-coral">
        <Briefcase className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate font-heading text-[14px] font-bold">{role.title}</div>
          <Badge tone={tone} className="text-[10px]">
            {ROLE_STATUS_LABELS[status] ?? role.status}
          </Badge>
        </div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          {[role.department, role.location, role.employment_type?.replace("_", " ")]
            .filter(Boolean)
            .join(" · ") || "—"}
        </div>
      </div>
      {role.status === "open" && (
        <a
          href={`/careers/${role.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View page
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </Link>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/30 py-12 text-center">
      <Briefcase className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-heading text-[15px] font-bold">No roles yet</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a role to open applications and track candidates.
        </p>
      </div>
      <Button variant="primary" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        New role
      </Button>
    </div>
  );
}
