"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  UserPlus,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/settings/add-user-dialog";
import {
  setUserRole,
  grantHrAccess,
  revokeHrAccess,
  type AdminUser,
  type Department,
  type HrAccessGrant,
  type HrGrantScope,
} from "@/lib/admin/actions";
import type { HavenUserRole } from "@/lib/auth/permissions";
import type { DbEmployee } from "@/lib/hr/types";

type Props = {
  users: AdminUser[];
  departments: Department[];
  grants: HrAccessGrant[];
  employees: DbEmployee[];
  currentUserId: string;
};

const ROLE_LABELS: Record<HavenUserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

const ROLE_ICONS: Record<HavenUserRole, React.ReactNode> = {
  user: <UserIcon className="h-3.5 w-3.5" />,
  admin: <Shield className="h-3.5 w-3.5" />,
  super_admin: <ShieldCheck className="h-3.5 w-3.5" />,
};

const ROLE_DESC: Record<HavenUserRole, string> = {
  user: "Work, Properties, Onboarding",
  admin: "Everything except HR & user management",
  super_admin: "Full access to everything",
};

export function UserPermissionsTable({
  users: initialUsers,
  departments,
  grants: initialGrants,
  employees,
  currentUserId,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [grants, setGrants] = useState(initialGrants);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Resync local state when the server-rendered page is refreshed
  // (e.g., after Add user calls router.refresh()).
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  useEffect(() => {
    setGrants(initialGrants);
  }, [initialGrants]);

  const handleRoleChange = (userId: string, role: HavenUserRole) => {
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(userId, role);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u)),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleAddGrant = (
    granteeId: string,
    scope: HrGrantScope,
    departmentId?: string,
    employeeId?: string,
  ) => {
    setError(null);
    startTransition(async () => {
      try {
        await grantHrAccess({
          grantee_id: granteeId,
          scope,
          department_id: departmentId,
          employee_id: employeeId,
        });
        // naive reload — just push a placeholder; parent revalidate handles it
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleRevokeGrant = (grantId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await revokeHrAccess(grantId);
        setGrants((prev) => prev.filter((g) => g.id !== grantId));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const grantsByUser = new Map<string, HrAccessGrant[]>();
  for (const g of grants) {
    if (!g.grantee_id) continue;
    const list = grantsByUser.get(g.grantee_id) ?? [];
    list.push(g);
    grantsByUser.set(g.grantee_id, list);
  }

  return (
    <section className="rounded-card border border-border bg-surface shadow-card">
      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-[12px] text-rose-700">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="text-[12px] text-muted-foreground">
          {users.length} user{users.length === 1 ? "" : "s"}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />

      <div className="grid grid-cols-[1fr_160px_220px_40px] items-center gap-3 border-b border-border bg-surface-alt/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div>User</div>
        <div>Role</div>
        <div>HR Access</div>
        <div />
      </div>

      <ul className="divide-y divide-border">
        {users.map((u) => {
          const userGrants = grantsByUser.get(u.id) ?? [];
          const hasHrAccess = u.role === "super_admin" || userGrants.length > 0;
          const isExpanded = expanded === u.id;
          const isSelf = u.id === currentUserId;

          return (
            <li key={u.id}>
              <div className="grid grid-cols-[1fr_160px_220px_40px] items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-surface-alt text-[12px] font-semibold flex items-center justify-center">
                    {(u.full_name ?? u.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">
                      {u.full_name ?? u.email}
                      {isSelf && (
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {u.email}
                    </div>
                  </div>
                </div>

                <div>
                  <select
                    disabled={pending || isSelf}
                    value={u.role}
                    onChange={(e) =>
                      handleRoleChange(u.id, e.target.value as HavenUserRole)
                    }
                    className="w-full rounded-[6px] border border-border bg-surface px-2 py-1.5 text-[12px] font-medium disabled:opacity-60"
                    title={isSelf ? "You can't change your own role" : ROLE_DESC[u.role]}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="text-[12px]">
                  {u.role === "super_admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                      <ShieldCheck className="h-3 w-3" />
                      All HR (inherited)
                    </span>
                  ) : userGrants.length === 0 ? (
                    <span className="text-muted-foreground">No HR access</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
                      <ShieldAlert className="h-3 w-3" />
                      {userGrants.length} grant
                      {userGrants.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : u.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[6px] hover:bg-surface-alt"
                  aria-label={isExpanded ? "Collapse" : "Expand HR access"}
                  disabled={u.role === "super_admin"}
                  title={
                    u.role === "super_admin"
                      ? "Super admins always have full HR access"
                      : "Manage HR access"
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isExpanded && u.role !== "super_admin" && (
                <div className="border-t border-border bg-surface-alt/30 px-4 py-3">
                  <HrGrantEditor
                    grantee={u}
                    grants={userGrants}
                    departments={departments}
                    employees={employees}
                    onAdd={handleAddGrant}
                    onRemove={handleRevokeGrant}
                    pending={pending}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HrGrantEditor({
  grantee,
  grants,
  departments,
  employees,
  onAdd,
  onRemove,
  pending,
}: {
  grantee: AdminUser;
  grants: HrAccessGrant[];
  departments: Department[];
  employees: DbEmployee[];
  onAdd: (
    granteeId: string,
    scope: HrGrantScope,
    departmentId?: string,
    employeeId?: string,
  ) => void;
  onRemove: (id: string) => void;
  pending: boolean;
}) {
  const [scope, setScope] = useState<HrGrantScope>("department");
  const [deptId, setDeptId] = useState<string>(departments[0]?.id ?? "");
  const [empId, setEmpId] = useState<string>(employees[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[12px] font-semibold text-foreground/80">
        HR access for {grantee.full_name ?? grantee.email}
      </div>

      {grants.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {grants.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-[6px] border border-border bg-surface px-3 py-1.5 text-[12px]"
            >
              <span>
                {g.scope === "all" && <strong>All HR records</strong>}
                {g.scope === "department" && (
                  <>
                    Department: <strong>{g.department_name ?? "—"}</strong>
                  </>
                )}
                {g.scope === "employee" && (
                  <>
                    Employee: <strong>{g.employee_name ?? "—"}</strong>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                disabled={pending}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                aria-label="Remove grant"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-dashed border-border bg-surface p-2">
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as HrGrantScope)}
          className="rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px]"
        >
          <option value="all">All HR records</option>
          <option value="department">Department</option>
          <option value="employee">Specific employee</option>
        </select>

        {scope === "department" && (
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px]"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        )}

        {scope === "employee" && (
          <select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px]"
          >
            {employees.length === 0 ? (
              <option value="">(no employees yet)</option>
            ) : (
              employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))
            )}
          </select>
        )}

        <Button
          size="sm"
          onClick={() =>
            onAdd(
              grantee.id,
              scope,
              scope === "department" ? deptId : undefined,
              scope === "employee" ? empId : undefined,
            )
          }
          disabled={
            pending ||
            (scope === "department" && !deptId) ||
            (scope === "employee" && !empId)
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Grant access
        </Button>
      </div>
    </div>
  );
}
