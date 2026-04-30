"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardPaste, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTopicFromPastedDraft } from "@/lib/content/actions";

/**
 * Paste an existing markdown/plain-text draft. The action derives the
 * topic skeleton (title, pillar, keyword) and seeds the article body so
 * the workspace opens with rich post content immediately.
 */
export function PasteDraftDialog({
  open,
  onOpenChange,
  spaceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spaceId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [titleHint, setTitleHint] = useState("");

  if (!open) return null;
  const wc = body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0;
  const enoughContent = wc >= 20;

  function close() {
    onOpenChange(false);
    setBody("");
    setTitleHint("");
  }

  function submit() {
    if (!enoughContent) return;
    startTransition(async () => {
      const r = await createTopicFromPastedDraft({
        space_id: spaceId,
        body,
        title_hint: titleHint.trim() || null,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Imported "${r.data.draft.title}" (${r.data.word_count} words)`);
      close();
      router.push(`/content/${r.data.topic.id}` as never);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-border bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft/60 text-haven-coral">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Import an existing draft
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Paste markdown or plain text. The studio derives a title,
                pillar, and target keyword, and seeds the post canvas with
                the body.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Optional working title
            </span>
            <input
              type="text"
              value={titleHint}
              onChange={(e) => setTitleHint(e.target.value)}
              placeholder="Defaults to the first heading or sentence"
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] text-foreground outline-none focus:border-haven-coral/40"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Draft content {wc > 0 ? `· ${wc} words` : ""}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              autoFocus
              placeholder="Paste your draft here. Markdown is fine — headings, lists, paragraphs."
              className="min-h-[280px] w-full resize-y rounded-md border border-border bg-surface-alt/30 px-3 py-2 font-mono text-[12.5px] leading-6 text-foreground outline-none focus:border-haven-coral/40"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-[11px] text-muted-foreground">
            {enoughContent
              ? "Ready to import — title, pillar, and keyword will be derived."
              : "Paste at least 20 words to import."}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={!enoughContent || pending}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              {pending ? "Importing…" : "Import draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
