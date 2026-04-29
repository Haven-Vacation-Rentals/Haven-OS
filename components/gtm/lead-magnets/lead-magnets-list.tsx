"use client";

/**
 * Lead Magnets list view — internal /gtm/lead-magnets page.
 *
 * Tabs: Active / Drafts / Archived. Each row links to the public landing
 * page URL, shows submission/view counts and provides quick actions
 * (copy link, edit, archive, restore, delete).
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  Archive,
  RotateCw,
  Trash2,
  ExternalLink,
  Eye,
  Inbox,
  Check,
  Sparkles,
  Pencil,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  archiveLeadMagnet,
  restoreLeadMagnet,
  deleteLeadMagnet,
  publishLeadMagnet,
  type LeadMagnet,
} from "@/lib/gtm/lead-magnets/actions";
import { CreateLeadMagnetDialog } from "@/components/gtm/lead-magnets/create-lead-magnet-dialog";

type Tab = "active" | "drafts" | "archived";

export function LeadMagnetsList({
  active,
  drafts,
  archived,
}: {
  active: LeadMagnet[];
  drafts: LeadMagnet[];
  archived: LeadMagnet[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(
    active.length > 0 ? "active" : drafts.length > 0 ? "drafts" : "active",
  );
  const [createOpen, setCreateOpen] = useState(false);

  const rows =
    tab === "active" ? active : tab === "drafts" ? drafts : archived;

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-1">
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Active
            <span className="ml-1.5 text-muted-foreground">{active.length}</span>
          </TabButton>
          <TabButton active={tab === "drafts"} onClick={() => setTab("drafts")}>
            Drafts
            <span className="ml-1.5 text-muted-foreground">{drafts.length}</span>
          </TabButton>
          <TabButton
            active={tab === "archived"}
            onClick={() => setTab("archived")}
          >
            Archived
            <span className="ml-1.5 text-muted-foreground">{archived.length}</span>
          </TabButton>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New lead magnet
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          tab={tab}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-[13.5px]">
            <thead className="bg-surface-alt/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Views</Th>
                <Th>Submissions</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <Row key={m.id} magnet={m} onChanged={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateLeadMagnetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => router.refresh()}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors " +
        (active
          ? "bg-accent-soft text-haven-coral-700"
          : "text-muted-foreground hover:bg-surface-alt hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={"px-4 py-2.5 text-left font-semibold " + className}>
      {children}
    </th>
  );
}

function Row({
  magnet,
  onChanged,
}: {
  magnet: LeadMagnet;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(
    () => canonicalUrl(`/lead-magnet/${magnet.slug}`),
    [magnet.slug],
  );

  const expiresAt = new Date(magnet.expires_at);
  const isExpired = expiresAt.getTime() < Date.now();
  const created = new Date(magnet.created_at);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Public URL copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Try again.");
    }
  };

  const handlePublish = () => {
    startTransition(async () => {
      const r = await publishLeadMagnet(magnet.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Lead magnet published");
        onChanged();
      }
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      const r = await archiveLeadMagnet(magnet.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Lead magnet archived");
        onChanged();
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const r = await restoreLeadMagnet(magnet.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Lead magnet restored");
        onChanged();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${magnet.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const r = await deleteLeadMagnet(magnet.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Lead magnet deleted");
        onChanged();
      }
    });
  };

  return (
    <tr className="border-t border-border hover:bg-surface-alt/30">
      <td className="px-4 py-3">
        <Link
          href={`/gtm/lead-magnets/${magnet.id}` as never}
          className="font-semibold text-foreground hover:text-haven-coral"
        >
          {magnet.title}
        </Link>
        {magnet.subtitle ? (
          <div
            className="truncate text-[12px] text-muted-foreground"
            title={magnet.subtitle}
          >
            {magnet.subtitle}
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3">
        {magnet.status === "draft" ? (
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Draft
          </span>
        ) : isExpired ? (
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Expired
          </span>
        ) : magnet.status === "archived" ? (
          <span className="rounded-full bg-muted/40 border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Archived
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-[12px] text-muted-foreground">
        {created.toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-[12px] text-muted-foreground">
        {expiresAt.toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-[12px] tabular-nums">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          {magnet.view_count}
        </span>
      </td>
      <td className="px-4 py-3 text-[12px] tabular-nums">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Inbox className="h-3 w-3" />
          {magnet.submission_count}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <IconAction title="Copy public URL" onClick={copyLink} disabled={pending}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </IconAction>
          <Link
            href={`/gtm/lead-magnets/${magnet.id}` as never}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            title="Open public page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {magnet.status === "draft" ? (
            <IconAction
              title="Publish"
              onClick={handlePublish}
              disabled={pending}
            >
              <Send className="h-3.5 w-3.5" />
            </IconAction>
          ) : null}
          {magnet.status === "active" ? (
            <IconAction title="Archive" onClick={handleArchive} disabled={pending}>
              <Archive className="h-3.5 w-3.5" />
            </IconAction>
          ) : magnet.status === "archived" ? (
            <IconAction title="Restore" onClick={handleRestore} disabled={pending}>
              <RotateCw className="h-3.5 w-3.5" />
            </IconAction>
          ) : null}
          <IconAction
            title="Delete"
            onClick={handleDelete}
            disabled={pending}
            danger
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </td>
    </tr>
  );
}

function IconAction({
  children,
  onClick,
  disabled,
  danger,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors " +
        (danger
          ? "text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
          : "text-muted-foreground hover:bg-surface-alt hover:text-foreground") +
        " disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

function EmptyState({
  onCreate,
  tab,
}: {
  onCreate: () => void;
  tab: Tab;
}) {
  const heading =
    tab === "archived"
      ? "No archived lead magnets"
      : tab === "drafts"
        ? "No drafts"
        : "No lead magnets yet";
  const body =
    tab === "archived"
      ? "Lead magnets you archive will show up here."
      : tab === "drafts"
        ? "Lead magnets you save without publishing live here. They get a public URL once you click Publish."
        : "Create a lead magnet to host a branded landing page — guide, checklist, calculator, anything. Submissions land back here.";
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-alt/20 px-6 py-16 text-center">
      <Sparkles className="h-8 w-8 text-haven-coral" />
      <h3 className="mt-3 font-heading text-display-4 text-foreground">
        {heading}
      </h3>
      <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{body}</p>
      {tab !== "archived" && (
        <Button variant="primary" className="mt-4" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Create your first lead magnet
        </Button>
      )}
    </div>
  );
}
