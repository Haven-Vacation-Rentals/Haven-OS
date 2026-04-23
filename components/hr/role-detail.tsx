"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ExternalLink, Plus, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleEditor } from "./role-editor";
import { CandidateKanban } from "./candidate-kanban";
import { CandidateEditor } from "./candidate-editor";
import { deleteRole } from "@/lib/hr/actions";
import {
  EMPLOYMENT_TYPE_LABELS,
  ROLE_STATUS_LABELS,
  type DbCandidate,
  type DbRole,
  type EmploymentType,
  type RoleStatus,
} from "@/lib/hr/types";

const STATUS_TONE: Record<RoleStatus, "neutral" | "success" | "warn"> = {
  draft: "neutral",
  open: "success",
  closed: "warn",
};

type Props = {
  role: DbRole;
  candidates: DbCandidate[];
};

export function RoleDetail({ role, candidates }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const status = role.status as RoleStatus;
  const tone = STATUS_TONE[status] ?? "neutral";
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/careers/${role.slug}`
    : `/careers/${role.slug}`;

  const remove = () => {
    if (!confirm(`Delete role "${role.title}"? This removes all candidates and cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteRole(role.id);
        router.push("/hr/hiring");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="haven-card flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-[20px] font-bold">{role.title}</h2>
            <Badge tone={tone}>{ROLE_STATUS_LABELS[status] ?? role.status}</Badge>
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {[role.department, role.location,
              role.employment_type
                ? EMPLOYMENT_TYPE_LABELS[role.employment_type as EmploymentType] ?? role.employment_type
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>
          {role.status === "open" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:brightness-90"
              >
                <ExternalLink className="h-3 w-3" />
                Public landing page
              </a>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Link2 className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit role
          </Button>
          <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      </div>

      {/* Candidates */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-[15px] font-bold">Candidates</h3>
            <p className="text-[12px] text-muted-foreground">
              Drag-free kanban — change stages from the card menu.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCandOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add candidate
          </Button>
        </div>
        <CandidateKanban candidates={candidates} roleId={role.id} />
      </section>

      <RoleEditor open={editOpen} onOpenChange={setEditOpen} role={role} />
      <CandidateEditor open={candOpen} onOpenChange={setCandOpen} roleId={role.id} />
    </div>
  );
}
