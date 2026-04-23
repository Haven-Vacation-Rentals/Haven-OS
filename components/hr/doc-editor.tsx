"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDoc, updateDoc } from "@/lib/hr/actions";
import type { DbHrDoc, DocKind } from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: DocKind;
  doc?: DbHrDoc | null;
};

export function DocEditor({ open, onOpenChange, kind, doc }: Props) {
  const editing = !!doc;
  const [title, setTitle] = useState(doc?.title ?? "");
  const [body, setBody] = useState(doc?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label = kind === "policy" ? "policy" : "procedure";

  const save = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing && doc) {
          await updateDoc(doc.id, { title, body }, kind);
        } else {
          await createDoc({ kind, title, body });
        }
        onOpenChange(false);
        if (!editing) {
          setTitle("");
          setBody("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${label}` : `New ${label}`}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="w-full rounded-md border border-border bg-surface p-3 font-mono text-[12.5px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Markdown supported: **bold**, *italic*, `code`, [links](https://…), lists, and ## headings.
            </p>
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : `Create ${label}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
