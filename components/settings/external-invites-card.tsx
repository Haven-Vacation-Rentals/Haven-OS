"use client";

/**
 * External invites — super-admin UI for inviting a specific non-Haven
 * email to sign in with Google. The default Haven domain restriction
 * stays for everyone else.
 *
 * Lives under /settings/users alongside the user permissions table.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  UserPlus,
  Copy,
  Check,
  XCircle,
  RotateCcw,
  Clock,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createExternalInvite,
  revokeExternalInvite,
  resendExternalInvite,
  type ExternalInvite,
  type InviteStatus,
} from "@/lib/admin/invites";
import type { HavenUserRole } from "@/lib/auth/permissions";

const ROLE_OPTIONS: { value: HavenUserRole; label: string; help: string }[] = [
  { value: "user", label: "User", help: "Work, Properties, Onboarding" },
  {
    value: "admin",
    label: "Admin",
    help: "Everything except HR & user management",
  },
  {
    value: "super_admin",
    label: "Super Admin",
    help: "Full access, including user management",
  },
];

type Props = {
  invites: ExternalInvite[];
};

export function ExternalInvitesCard({ invites: initial }: Props) {
  const router = useRouter();
  const [invites, setInvites] = useState<ExternalInvite[]>(initial);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setInvites(initial);
  }, [initial]);

  const groups = useMemo(() => {
    const byStatus: Record<InviteStatus, ExternalInvite[]> = {
      pending: [],
      accepted: [],
      revoked: [],
      expired: [],
    };
    for (const inv of invites) byStatus[inv.status].push(inv);
    return byStatus;
  }, [invites]);

  const handleRevoke = (inv: ExternalInvite) => {
    if (!confirm(`Revoke invite for ${inv.email}? They won't be able to sign in.`))
      return;
    setError(null);
    startTransition(async () => {
      const r = await revokeExternalInvite(inv.id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const handleResend = (inv: ExternalInvite) => {
    setError(null);
    startTransition(async () => {
      const r = await resendExternalInvite(inv.id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const handleCopy = async (inv: ExternalInvite) => {
    try {
      await navigator.clipboard.writeText(inv.invite_url);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {
      setError("Couldn't copy to clipboard — copy the link manually.");
    }
  };

  return (
    <section className="rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-heading text-[14px] font-bold">
            External email invites
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Allow a specific non-Haven email to sign in with Google.
            Everyone else still needs a Haven address.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Invite external email
        </Button>
      </header>

      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-[12px] text-rose-700">
          {error}
        </div>
      )}

      <InviteDialog open={open} onOpenChange={setOpen} />

      {invites.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
          No external invites yet.
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_120px_160px_180px_180px] items-center gap-3 border-b border-border bg-surface-alt/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Expires</div>
          <div className="text-right">Actions</div>
        </div>
      )}

      <ul className="divide-y divide-border">
        {(["pending", "accepted", "expired", "revoked"] as InviteStatus[]).flatMap(
          (status) =>
            groups[status].map((inv) => (
              <InviteRow
                key={inv.id}
                invite={inv}
                pending={pending}
                copied={copiedId === inv.id}
                onRevoke={() => handleRevoke(inv)}
                onResend={() => handleResend(inv)}
                onCopy={() => handleCopy(inv)}
              />
            )),
        )}
      </ul>
    </section>
  );
}

function InviteRow({
  invite,
  pending,
  copied,
  onRevoke,
  onResend,
  onCopy,
}: {
  invite: ExternalInvite;
  pending: boolean;
  copied: boolean;
  onRevoke: () => void;
  onResend: () => void;
  onCopy: () => void;
}) {
  const canResend = invite.status === "pending" || invite.status === "expired";
  const canRevoke = invite.status === "pending" || invite.status === "accepted";
  const canCopy = invite.status === "pending" || invite.status === "expired";
  return (
    <li className="grid grid-cols-[1fr_120px_160px_180px_180px] items-center gap-3 px-4 py-3 text-[12px]">
      <div className="min-w-0">
        <div className="truncate font-medium">{invite.email}</div>
        {invite.full_name ? (
          <div className="truncate text-[11px] text-muted-foreground">
            {invite.full_name}
          </div>
        ) : null}
        {invite.note ? (
          <div className="truncate text-[11px] text-muted-foreground italic">
            “{invite.note}”
          </div>
        ) : null}
      </div>
      <div className="capitalize">{invite.role.replace("_", " ")}</div>
      <div>
        <StatusPill status={invite.status} />
      </div>
      <div className="text-[11px] text-muted-foreground">
        {formatExpiry(invite)}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {canCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-alt/60"
            title="Copy invite link"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy link
              </>
            )}
          </button>
        )}
        {canResend && (
          <button
            type="button"
            onClick={onResend}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-alt/60 disabled:opacity-50"
            title="Extend expiry / resend"
          >
            <RotateCcw className="h-3 w-3" /> Resend
          </button>
        )}
        {canRevoke && (
          <button
            type="button"
            onClick={onRevoke}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            title="Revoke invite"
          >
            <XCircle className="h-3 w-3" /> Revoke
          </button>
        )}
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: InviteStatus }) {
  const map: Record<InviteStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      icon: <Clock className="h-3 w-3" />,
    },
    accepted: {
      label: "Accepted",
      cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: <Check className="h-3 w-3" />,
    },
    revoked: {
      label: "Revoked",
      cls: "bg-rose-50 text-rose-800 border-rose-200",
      icon: <ShieldOff className="h-3 w-3" />,
    },
    expired: {
      label: "Expired",
      cls: "bg-zinc-50 text-zinc-700 border-zinc-200",
      icon: <Clock className="h-3 w-3" />,
    },
  };
  const v = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${v.cls}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
}

function formatExpiry(inv: ExternalInvite): string {
  if (inv.status === "accepted")
    return inv.accepted_at
      ? `Accepted ${formatDate(inv.accepted_at)}`
      : "Accepted";
  if (inv.status === "revoked")
    return inv.revoked_at
      ? `Revoked ${formatDate(inv.revoked_at)}`
      : "Revoked";
  if (!inv.expires_at) return "No expiry";
  const ts = new Date(inv.expires_at).getTime();
  const now = Date.now();
  if (ts < now) return `Expired ${formatDate(inv.expires_at)}`;
  const days = Math.ceil((ts - now) / (24 * 60 * 60 * 1000));
  if (days <= 1) return "Expires within a day";
  return `Expires in ${days} days`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<HavenUserRole>("user");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    email: string;
    invite_url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setFullName("");
    setRole("user");
    setExpiresInDays(14);
    setNote("");
    setError(null);
    setSuccess(null);
    setCopied(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    startTransition(async () => {
      const r = await createExternalInvite({
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        role,
        expires_in_days: expiresInDays,
        note: note.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess({ email: r.invite.email, invite_url: r.invite.invite_url });
      router.refresh();
    });
  };

  const handleCopyLink = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Couldn't copy to clipboard — copy the link manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-haven-coral-600" />
            Invite external email
          </DialogTitle>
          <DialogDescription>
            Allow a single non-Haven email to sign in with Google. The
            link is bound to the exact address — having the link alone
            isn’t enough to get in.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
              Invite created for <strong>{success.email}</strong>. Share
              this sign-in link with them, or wait — they’ll be admitted
              the first time they sign in with Google using this exact
              address.
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={success.invite_url}
                className="font-mono text-[11px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </>
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="primary" onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Email">
              <Input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="someone@externalpartner.com"
                disabled={pending}
              />
            </Field>
            <Field label="Full name" optional>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                disabled={pending}
              />
            </Field>
            <Field label="Role">
              <div className="flex flex-col gap-1.5">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={
                      "flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors " +
                      (role === opt.value
                        ? "border-haven-coral-600 bg-accent-soft/40"
                        : "border-border hover:bg-surface-alt/50")
                    }
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={role === opt.value}
                      onChange={() => setRole(opt.value)}
                      disabled={pending}
                      className="mt-0.5 h-3.5 w-3.5 accent-haven-coral-600"
                    />
                    <span className="flex-1 text-[13px]">
                      <span className="block font-medium">{opt.label}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {opt.help}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Expires in (days)">
              <Input
                type="number"
                min={1}
                max={60}
                value={expiresInDays}
                onChange={(e) =>
                  setExpiresInDays(Math.max(1, Math.min(60, Number(e.target.value) || 14)))
                }
                disabled={pending}
              />
            </Field>
            <Field label="Note" optional>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this invite, who they are…"
                disabled={pending}
              />
            </Field>
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                {error}
              </div>
            ) : null}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={pending || !email.trim()}
              >
                {pending ? "Creating…" : "Create invite"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 text-muted-foreground/70 normal-case font-normal">
            (optional)
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
