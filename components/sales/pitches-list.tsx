"use client";

/**
 * Pitches list view — internal /sales/pitches page.
 *
 * Tabs: Active / Archived. Each row links to the public pitch URL,
 * shows projection range, status, view count, and provides quick
 * actions (copy link, archive, restore, delete).
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  Archive,
  RotateCw,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  Megaphone,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  archivePitch,
  restorePitch,
  deletePitch,
  type SalesPitch,
} from "@/lib/sales/actions";
import { CreatePitchDialog } from "@/components/sales/create-pitch-dialog";
import { EditPhotosDialog } from "@/components/sales/edit-photos-dialog";

type Tab = "active" | "archived";

export function PitchesList({
  active,
  archived,
}: {
  active: SalesPitch[];
  archived: SalesPitch[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const rows = tab === "active" ? active : archived;

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex gap-1">
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Active
            <span className="ml-1.5 text-muted-foreground">{active.length}</span>
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
          New pitch
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} archived={tab === "archived"} />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-[13.5px]">
            <thead className="bg-surface-alt/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <Th>Owner / Property</Th>
                <Th>Projection</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Views</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <PitchRow key={p.id} pitch={p} onChanged={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreatePitchDialog
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

function PitchRow({
  pitch,
  onChanged,
}: {
  pitch: SalesPitch;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return `/pitch/${pitch.slug}`;
    return `${window.location.origin}/pitch/${pitch.slug}`;
  }, [pitch.slug]);

  const expiresAt = new Date(pitch.expires_at);
  const isExpired = expiresAt.getTime() < Date.now();
  const created = new Date(pitch.created_at);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Pitch link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Try again.");
    }
  };

  const handleArchive = () => {
    startTransition(async () => {
      const r = await archivePitch(pitch.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Pitch archived");
        onChanged();
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const r = await restorePitch(pitch.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Pitch restored");
        onChanged();
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete pitch for ${pitch.owner_name}? This cannot be undone.`))
      return;
    startTransition(async () => {
      const r = await deletePitch(pitch.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Pitch deleted");
        onChanged();
      }
    });
  };

  return (
    <tr className="border-t border-border hover:bg-surface-alt/30">
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">{pitch.owner_name}</div>
        <div className="truncate text-[12px] text-muted-foreground" title={pitch.property_address}>
          {pitch.property_address}
        </div>
      </td>
      <td className="px-4 py-3 font-medium tabular-nums">
        ${(pitch.projection_low / 1000).toFixed(0)}k–$
        {(pitch.projection_high / 1000).toFixed(0)}k
      </td>
      <td className="px-4 py-3">
        {isExpired ? (
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Expired
          </span>
        ) : pitch.status === "archived" ? (
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
          {pitch.view_count}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <IconAction title="Copy link" onClick={copyLink} disabled={pending}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </IconAction>
          <IconAction
            title="Edit photos"
            onClick={() => setPhotosOpen(true)}
            disabled={pending}
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </IconAction>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            title="Open pitch"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {pitch.status === "active" ? (
            <IconAction title="Archive" onClick={handleArchive} disabled={pending}>
              <Archive className="h-3.5 w-3.5" />
            </IconAction>
          ) : (
            <IconAction title="Restore" onClick={handleRestore} disabled={pending}>
              <RotateCw className="h-3.5 w-3.5" />
            </IconAction>
          )}
          <IconAction
            title="Delete"
            onClick={handleDelete}
            disabled={pending}
            danger
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconAction>
        </div>
        <EditPhotosDialog
          pitch={pitch}
          open={photosOpen}
          onOpenChange={setPhotosOpen}
          onSaved={onChanged}
        />
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
  archived,
}: {
  onCreate: () => void;
  archived: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-alt/20 px-6 py-16 text-center">
      <Megaphone className="h-8 w-8 text-haven-coral" />
      <h3 className="mt-3 font-heading text-display-4 text-foreground">
        {archived ? "No archived pitches" : "No pitches yet"}
      </h3>
      <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
        {archived
          ? "Pitches you archive will show up here."
          : "Create a pitch to send to a property owner. Drop in a Zillow / Airbnb / VRBO link and we'll auto-fill what we can."}
      </p>
      {!archived && (
        <Button variant="primary" className="mt-4" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Create your first pitch
        </Button>
      )}
    </div>
  );
}


