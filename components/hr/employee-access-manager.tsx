"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X, ShieldCheck, ShieldAlert, Building2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  grantHrAccess,
  revokeHrAccess,
  revokeHrModule,
  type AdminUser,
} from "@/lib/admin/actions";
import type { EmployeeAccessEntry } from "@/lib/hr/actions";

type Props = {
  employeeId: string;
  employeeName: string;
  initialAccess: EmployeeAccessEntry[];
  users: AdminUser[];
  // True when the viewer is allowed to grant/revoke (super_admin).
  canManage: boolean;
};

export function EmployeeAccessManager({
  employeeId,
  employeeName,
  initialAccess,
  users,
  canManage,
}: Props) {
  const [access, setAccess] = useState(initialAccess);
  const [pickUserId, setPickUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accessByUser = useMemo(() => {
    const m = new Map<string, EmployeeAccessEntry>();
    for (const e of access) m.set(e.user_id, e);
    return m;
  }, [access]);

  // Users we could still grant access to (not already covered).
  const candidates = useMemo(() => {
    return users.filter((u) => {
      const a = accessByUser.get(u.id);
      // Allow re-grant if existing access is via a department grant — admin
      // may want to add a person-specific grant on top, but normally we just
      // hide them. We'll hide already-covered users entirely to keep UX
      // simple.
      return !a;
    });
  }, [users, accessByUser]);

  const grantPerson = () => {
    if (!pickUserId) return;
    setError(null);
    startTransition(async () => {
      try {
        await grantHrAccess({
          grantee_id: pickUserId,
          scope: "employee",
          employee_id: employeeId,
        });
        // Optimistic update
        const u = users.find((x) => x.id === pickUserId);
        if (u) {
          setAccess((prev) => [
            ...prev,
            {
              user_id: u.id,
              email: u.email,
              full_name: u.full_name,
              role: u.role,
              source: "employee",
              grant_id: "__new__", // placeholder; refresh will replace
              department_name: null,
            },
          ]);
        }
        setPickUserId("");
        // Hard refresh to pick up the new grant id
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const revoke = (entry: EmployeeAccessEntry) => {
    if (!entry.grant_id || entry.grant_id === "__new__") return;
    if (entry.source === "module") {
      if (!confirm(
        `Revoking this user's People module grant will remove their access to every employee, not just ${employeeName}. Continue?`,
      )) return;
    } else if (entry.source === "all") {
      if (!confirm(
        `Revoking this user's "all HR" grant will remove their access to every employee, not just ${employeeName}. Continue?`,
      )) return;
    } else if (entry.source === "department") {
      if (!confirm(
        `This user's access comes from a department grant${
          entry.department_name ? ` (${entry.department_name})` : ""
        }. Revoking it will remove their access to everyone in that department. Continue?`,
      )) return;
    }
    setError(null);
    startTransition(async () => {
      try {
        if (entry.source === "module") {
          await revokeHrModule(entry.grant_id!);
        } else {
          await revokeHrAccess(entry.grant_id!);
        }
        setAccess((prev) => prev.filter((e) => e.grant_id !== entry.grant_id));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="haven-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <div className="font-heading text-[14px] font-bold">Who can access this person</div>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Super admins always have access. People can also gain access by an
        all-HR grant, a department grant, or a per-person grant.
      </p>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {access.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          No one currently has access to this person.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[6px] border border-border">
          {access.map((a) => (
            <li
              key={`${a.user_id}-${a.source}-${a.grant_id ?? "x"}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">
                  {a.full_name ?? a.email ?? "—"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {a.email}
                </div>
              </div>
              <SourceBadge entry={a} />
              {canManage && a.grant_id && a.source !== "super_admin" ? (
                <button
                  type="button"
                  onClick={() => revoke(a)}
                  disabled={pending}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  aria-label="Revoke access"
                  title="Revoke this grant"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="h-6 w-6" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-dashed border-border bg-surface p-2">
          <select
            value={pickUserId}
            onChange={(e) => setPickUserId(e.target.value)}
            className="h-9 flex-1 min-w-[180px] rounded-md border border-border bg-surface px-2 text-[12px]"
          >
            <option value="">Add a user…</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {(u.full_name ?? u.email)} {u.role !== "user" ? `· ${u.role}` : ""}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="primary"
            onClick={grantPerson}
            disabled={pending || !pickUserId}
          >
            <Plus className="h-3.5 w-3.5" />
            Grant access
          </Button>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ entry }: { entry: EmployeeAccessEntry }) {
  switch (entry.source) {
    case "super_admin":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">
          <ShieldCheck className="h-3 w-3" />
          Super admin
        </span>
      );
    case "module":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <ShieldCheck className="h-3 w-3" />
          People module
        </span>
      );
    case "all":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700">
          <ShieldAlert className="h-3 w-3" />
          All HR
        </span>
      );
    case "department":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
          <Building2 className="h-3 w-3" />
          Department{entry.department_name ? `: ${entry.department_name}` : ""}
        </span>
      );
    case "employee":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
          <UserIcon className="h-3 w-3" />
          Direct
        </span>
      );
  }
}
