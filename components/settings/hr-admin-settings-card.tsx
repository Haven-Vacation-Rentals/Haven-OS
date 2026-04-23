"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addHrAdmin, removeHrAdmin } from "@/lib/hr/actions";

type Props = {
  initialAdmins: string[];
  currentUserEmail: string;
};

export function HrAdminSettingsCard({ initialAdmins, currentUserEmail }: Props) {
  const [admins, setAdmins] = useState<string[]>(initialAdmins);
  const [newAdmin, setNewAdmin] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminPending, startAdmin] = useTransition();

  const handleAddAdmin = () => {
    setAdminError(null);
    const clean = newAdmin.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setAdminError("Valid email required");
      return;
    }
    startAdmin(async () => {
      try {
        await addHrAdmin(clean);
        setAdmins((prev) => Array.from(new Set([...prev, clean])).sort());
        setNewAdmin("");
      } catch (e) {
        setAdminError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleRemoveAdmin = (email: string) => {
    setAdminError(null);
    startAdmin(async () => {
      try {
        await removeHrAdmin(email);
        setAdmins((prev) => prev.filter((a) => a !== email));
      } catch (e) {
        setAdminError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
        HR
      </h2>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-surface-alt p-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-[15px] font-bold">HR admins</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              HR admins can view the HR section, manage employees, log issues,
              run performance reviews, and publish job roles to the public
              careers page.
            </p>
          </div>
        </div>

        <ul className="mb-3 flex flex-col gap-1">
          {admins.length === 0 && (
            <li className="text-[12px] italic text-muted-foreground">
              No HR admins yet.
            </li>
          )}
          {admins.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between rounded-md border border-border bg-surface-alt/40 px-3 py-2 text-[13px]"
            >
              <span className="truncate">
                {email}
                {email.toLowerCase() === currentUserEmail.toLowerCase() && (
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    (you)
                  </span>
                )}
              </span>
              <button
                onClick={() => handleRemoveAdmin(email)}
                disabled={
                  adminPending ||
                  email.toLowerCase() === currentUserEmail.toLowerCase()
                }
                className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-red-600 disabled:opacity-30"
                aria-label={`Remove ${email}`}
                title={
                  email.toLowerCase() === currentUserEmail.toLowerCase()
                    ? "You can't remove yourself"
                    : "Remove HR admin"
                }
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAdmin();
              }
            }}
            placeholder="teammate@havenvacationrentals.com"
            type="email"
          />
          <Button onClick={handleAddAdmin} disabled={adminPending} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {adminError && (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {adminError}
          </div>
        )}
      </section>
    </div>
  );
}
