"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Copy,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createToken,
  revokeToken,
  deleteToken,
} from "@/lib/api-tokens/actions";
import {
  API_SCOPE_CATALOG,
  type ApiScope,
  type PersonalAccessTokenPublic,
} from "@/lib/api-tokens/types";

type Props = {
  initialTokens: PersonalAccessTokenPublic[];
  isSuperAdmin: boolean;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function tokenStatus(t: PersonalAccessTokenPublic): {
  label: string;
  tone: "ok" | "warn" | "bad";
} {
  if (t.revoked_at) return { label: "Revoked", tone: "bad" };
  if (t.expires_at && Date.parse(t.expires_at) <= Date.now())
    return { label: "Expired", tone: "bad" };
  if (
    t.expires_at &&
    Date.parse(t.expires_at) - Date.now() < 7 * 24 * 60 * 60 * 1000
  )
    return { label: "Expiring soon", tone: "warn" };
  return { label: "Active", tone: "ok" };
}

export function ApiTokensCard({ initialTokens, isSuperAdmin }: Props) {
  const [tokens, setTokens] = useState(initialTokens);
  const [creating, setCreating] = useState(false);
  const [createdRaw, setCreatedRaw] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...tokens].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [tokens],
  );

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this token? Any agent or script using it will stop working immediately.")) return;
    try {
      await revokeToken(id);
      setTokens((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, revoked_at: new Date().toISOString() } : t,
        ),
      );
      toast.success("Token revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke token");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this token? This cannot be undone.")) return;
    try {
      await deleteToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      toast.success("Token deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete token");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card border border-border bg-surface shadow-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-surface-alt p-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <div className="font-heading text-[14px] font-bold">
                Your tokens
              </div>
              <div className="text-[12px] text-muted-foreground">
                Bearer tokens for the public Haven OS API.
              </div>
            </div>
          </div>
          <CreateTokenButton
            open={creating}
            onOpenChange={setCreating}
            onCreated={(t, raw) => {
              setTokens((prev) => [t, ...prev]);
              setCreatedRaw(raw);
              setCreating(false);
            }}
          />
        </header>

        {createdRaw && (
          <RawTokenBanner
            raw={createdRaw}
            onDismiss={() => setCreatedRaw(null)}
          />
        )}

        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
            No tokens yet. Create one to give an external agent or script API
            access.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((t) => {
              const status = tokenStatus(t);
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-[14px] font-bold">
                        {t.name}
                      </span>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      <span className="font-mono">{t.token_prefix}…</span>
                      {" · "}
                      Created {formatDate(t.created_at)}
                      {" · "}
                      Last used {formatDate(t.last_used_at)}
                      {t.expires_at ? ` · Expires ${formatDate(t.expires_at)}` : " · No expiry"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Scopes:{" "}
                      <span className="font-mono">
                        {t.scopes.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!t.revoked_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(t.id)}
                      >
                        Revoke
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(t.id)}
                      aria-label="Delete token"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        Tokens authenticate as you. They follow the same role, HR grants, and
        list/space access controls as your account.
        {isSuperAdmin && " Super admins can revoke any user's token from the database."}
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create dialog
// ---------------------------------------------------------------------------

function CreateTokenButton({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (t: PersonalAccessTokenPublic, raw: string) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["platform:full"]);
  const [expiry, setExpiry] = useState<string>(""); // YYYY-MM-DD or empty
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setScopes(["platform:full"]);
    setExpiry("");
    setError(null);
  };

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const expires_at = expiry ? new Date(expiry).toISOString() : null;
    startTransition(async () => {
      try {
        const result = await createToken({
          name: name.trim(),
          scopes,
          expires_at,
        });
        onCreated(result.token, result.raw);
        reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const toggleScope = (s: ApiScope) => {
    setScopes((prev) => {
      if (s === "platform:full") return ["platform:full"];
      const next = prev.filter((x) => x !== "platform:full");
      return next.includes(s)
        ? next.filter((x) => x !== s)
        : [...next, s];
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4" />
          New token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create personal access token</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              Name
            </span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. zapier, lost-items-bot"
              maxLength={80}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              Expiration (optional)
            </span>
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10)}
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              Scopes
            </legend>
            <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-alt/40 p-3 max-h-64 overflow-auto">
              {API_SCOPE_CATALOG.map((info) => {
                const checked = scopes.includes(info.scope);
                const disabled =
                  info.scope !== "platform:full" &&
                  scopes.includes("platform:full");
                return (
                  <label
                    key={info.scope}
                    className="flex items-start gap-2.5 text-[13px]"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleScope(info.scope)}
                    />
                    <span className="flex-1">
                      <span className="font-mono text-[12px] font-bold">
                        {info.scope}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {info.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Creating…" : "Create token"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Raw-token banner shown once after creation
// ---------------------------------------------------------------------------

function RawTokenBanner({
  raw,
  onDismiss,
}: {
  raw: string;
  onDismiss: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      toast.success("Token copied to clipboard");
    } catch {
      toast.error("Couldn't copy — please select and copy manually");
    }
  };
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="font-heading text-[13px] font-bold text-amber-900">
            Save this token now — it won&apos;t be shown again.
          </div>
          <code className="block break-all rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-[12px] text-amber-900">
            {raw}
          </code>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-1.5">
          <Button variant="primary" size="sm" onClick={copy}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
