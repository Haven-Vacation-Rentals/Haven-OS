"use client";

/**
 * CreateLeadMagnetDialog — admin-facing modal to spin up a new lead
 * magnet landing page.
 *
 * Minimal-first: title is the only required field. Everything else can
 * be filled in (and iterated on) from the detail page — copy, content
 * blocks, CTA fields, expiration date.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/canonical-url";
import { createLeadMagnet } from "@/lib/gtm/lead-magnets/actions";

export function CreateLeadMagnetDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [eyebrow, setEyebrow] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Get the guide");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setTitle("");
    setEyebrow("");
    setSubtitle("");
    setHeroImageUrl("");
    setCtaLabel("Get the guide");
    setOwnerName("");
    setOwnerEmail("");
    setPublishNow(false);
    setError(null);
    setCreatedUrl(null);
    setCreatedId(null);
    setCopied(false);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    startTransition(async () => {
      const r = await createLeadMagnet({
        title: title.trim(),
        eyebrow: eyebrow.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        hero_image_url: heroImageUrl.trim() || undefined,
        cta: {
          label: ctaLabel.trim() || "Get the guide",
          type: "form",
          fields: ["name", "email"],
        },
        owner_name: ownerName.trim() || undefined,
        owner_email: ownerEmail.trim() || undefined,
        status: publishNow ? "active" : "draft",
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setCreatedUrl(canonicalUrl(`/lead-magnet/${r.data.slug}`));
      setCreatedId(r.data.id);
      toast.success(
        publishNow ? "Lead magnet published" : "Lead magnet saved as draft",
      );
      onCreated?.();
      router.refresh();
    });
  };

  const handleCopy = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success("Public URL copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Try again.");
    }
  };

  // Success view — show the public URL + open editor link.
  if (createdUrl && createdId) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead magnet created</DialogTitle>
            <DialogDescription>
              Share the public URL or jump in to fine-tune the page content,
              CTA, and capture fields.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-surface-alt/40 px-3 py-2 text-[13px]">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-haven-coral-700">
                {createdUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={createdUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
                title="Open"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => close(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                close(false);
                router.push(`/gtm/lead-magnets/${createdId}` as never);
              }}
            >
              Edit content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-haven-coral" />
            New lead magnet
          </DialogTitle>
          <DialogDescription>
            Spin up a new branded landing page. You can edit copy, sections,
            CTA fields, and expiration after creating.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field
            label="Title"
            required
            hint="Headline shown at the top of the landing page."
          >
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Smoky Mountain STR Owner's Playbook"
            />
          </Field>

          <Field
            label="Eyebrow"
            hint="Optional small caps label above the title."
          >
            <Input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="Free guide"
            />
          </Field>

          <Field label="Subtitle / hook">
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="What to know before you list a cabin in Pigeon Forge"
            />
          </Field>

          <Field label="Hero image URL" hint="Optional.">
            <Input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field
            label="Primary CTA label"
            hint="The button text on the capture form."
          >
            <Input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Send me the guide"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner name">
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jack Zoppa"
              />
            </Field>
            <Field label="Owner email">
              <Input
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="jack@haven…"
                type="email"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-foreground">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Publish immediately (otherwise saved as a draft)
          </label>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={pending}>
            {pending ? "Creating…" : "Create lead magnet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="ml-1 text-haven-coral">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="text-[11.5px] font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
