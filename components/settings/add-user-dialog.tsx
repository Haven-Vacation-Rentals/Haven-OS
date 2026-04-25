"use client";

/**
 * AddUserDialog — super-admin form to create / invite a new Haven OS user.
 *
 * Two modes:
 *  - Invite (default): Supabase sends a magic-link email; the user
 *    confirms, sets a password, and lands in Haven OS.
 *  - Direct: create immediately with a password. No email sent.
 *
 * Closes on success and triggers a router refresh so the table re-reads
 * with the new row.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, UserPlus, X } from "lucide-react";
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
import { createUser } from "@/lib/admin/actions";
import type { HavenUserRole } from "@/lib/auth/permissions";

type Mode = "invite" | "direct";

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

export function AddUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("invite");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<HavenUserRole>("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setMode("invite");
    setEmail("");
    setFullName("");
    setRole("user");
    setPassword("");
    setError(null);
    setSuccess(null);
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
    if (mode === "direct" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      try {
        const u = await createUser({
          email: email.trim(),
          full_name: fullName.trim() || undefined,
          role,
          mode,
          password: mode === "direct" ? password : undefined,
        });
        setSuccess(
          mode === "invite"
            ? `Invite sent to ${u.email}. They’ll receive an email to set a password.`
            : `User ${u.email} created and ready to sign in.`,
        );
        // Refresh the parent's server data so the table picks up the new row.
        router.refresh();
        // Brief delay so the user sees the success state before close.
        setTimeout(() => {
          handleClose(false);
        }, 1400);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-haven-coral-600" />
            Add user
          </DialogTitle>
          <DialogDescription>
            Invite by email or create with a password. The user will be added
            to Haven OS with the role you choose.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={mode === "invite"}
            onClick={() => setMode("invite")}
            icon={<Mail className="h-4 w-4" />}
            label="Invite by email"
            help="Magic-link email"
          />
          <ModeButton
            active={mode === "direct"}
            onClick={() => setMode("direct")}
            icon={<KeyRound className="h-4 w-4" />}
            label="Create with password"
            help="No email sent"
          />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <Field label="Email">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@havenvacationrentals.com"
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

          {mode === "direct" ? (
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={pending}
              />
            </Field>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] text-rose-700 flex items-start gap-2">
            <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] text-emerald-700">
            {success}
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
            {pending
              ? mode === "invite"
                ? "Sending invite…"
                : "Creating…"
              : mode === "invite"
              ? "Send invite"
              : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  help,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  help: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors " +
        (active
          ? "border-haven-coral-600 bg-accent-soft/40"
          : "border-border hover:bg-surface-alt/50")
      }
    >
      <span
        className={
          "inline-flex items-center gap-2 text-[13px] font-medium " +
          (active ? "text-haven-coral-700" : "text-foreground")
        }
      >
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-muted-foreground">{help}</span>
    </button>
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
