"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocEditor } from "./doc-editor";
import { deleteDoc } from "@/lib/hr/actions";
import { renderAnnouncementBody } from "@/lib/board/markdown";
import type { DbHrDoc, DocKind } from "@/lib/hr/types";

export function DocsList({ kind, docs }: { kind: DocKind; docs: DbHrDoc[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<DbHrDoc | null>(null);
  const [, startTransition] = useTransition();

  const remove = (doc: DbHrDoc) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteDoc(doc.id, kind);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const Icon = kind === "policy" ? FileText : ClipboardList;
  const label = kind === "policy" ? "Policy" : "Procedure";
  const labelPlural = kind === "policy" ? "Policies" : "Procedures";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-[18px] font-bold">{labelPlural}</h2>
          <p className="text-sm text-muted-foreground">
            {kind === "policy"
              ? "Company policies. Edit anytime — all HR admins can view."
              : "Step-by-step procedures and playbooks."}
          </p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New {label.toLowerCase()}
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/30 py-12 text-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="font-heading text-[15px] font-bold">No {labelPlural.toLowerCase()} yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Document your first {label.toLowerCase()} to keep the team aligned.
            </p>
          </div>
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            New {label.toLowerCase()}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <article key={doc.id} className="haven-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-[16px] font-bold">{doc.title}</h3>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Updated {formatDate(doc.updated_at)}
                    {doc.created_by ? ` · created by ${doc.created_by}` : ""}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(doc)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(doc)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              </div>
              {doc.body && (
                <div
                  className="haven-prose mt-3 flex flex-col gap-3 text-[13px] leading-relaxed text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: renderAnnouncementBody(doc.body) }}
                />
              )}
            </article>
          ))}
        </div>
      )}

      <DocEditor open={newOpen} onOpenChange={setNewOpen} kind={kind} />
      <DocEditor
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        kind={kind}
        doc={editing}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
