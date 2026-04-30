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
  setHrModulesForUser,
  type AdminSurveyOption,
  type AdminUser,
  type Department,
  type HrAccessGrant,
  type HrGrantScope,
  type HrModuleGrant,
} from "@/lib/admin/actions";
import type { HavenUserRole } from "@/lib/auth/permissions";
import {
  HR_MODULES,
  HR_MODULE_LABELS,
  type HrModule,
} from "@/lib/auth/hr-modules";
import type { DbEmployee } from "@/lib/hr/types";

type Props = {
  users: AdminUser[];
  departments: Department[];
  grants: HrAccessGrant[];
  moduleGrants: HrModuleGrant[];
  surveys: AdminSurveyOption[];
  employees: DbEmployee[];
  currentUserId: string;
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
  moduleGrants: initialModuleGrants,
  surveys,
  employees,
  currentUserId,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [grants, setGrants] = useState(initialGrants);
  const [moduleGrants, setModuleGrants] = useState(initialModuleGrants);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  useEffect(() => {
    setGrants(initialGrants);
  }, [initialGrants]);
  useEffect(() => {
    setModuleGrants(initialModuleGrants);
  }, [initialModuleGrants]);

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
    target: { departmentId?: string; employeeId?: string; surveyId?: string },
  ) => {
    setError(null);
    startTransition(async () => {
      try {
        await grantHrAccess({
          grantee_id: granteeId,
          scope,
          department_id: target.departmentId,
          employee_id: target.employeeId,
          survey_id: target.surveyId,
        });
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

  const handleSetModules = (granteeId: string, modules: HrModule[]) => {
    setError(null);
    startTransition(async () => {
      try {
        await setHrModulesForUser({ grantee_id: granteeId, modules });
        // reload to resync the truth
        window.location.reload();
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
  const modulesByUser = new Map<string, HrModuleGrant[]>();
  for (const g of moduleGrants) {
    if (!g.grantee_id) continue;
    const list = modulesByUser.get(g.grantee_id) ?? [];
    list.push(g);
    modulesByUser.set(g.grantee_id, list);
  }

  return (
    <section className="rounded-card border border-border bg-surface shadow-card">
      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-[12px] text-rose-700">
          {error}
        </div>
      )}

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

      <div className="grid grid-cols-[1fr_160px_240px_40px] items-center gap-3 border-b border-border bg-surface-alt/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div>User</div>
        <div>Role</div>
        <div>HR Access</div>
        <div />
      </div>

      <ul className="divide-y divide-border">
        {users.map((u) => {
          const userGrants = grantsByUser.get(u.id) ?? [];
          const userModules = modulesByUser.get(u.id) ?? [];
          const isExpanded = expanded === u.id;
          const isSelf = u.id === currentUserId;

          return (
            <li key={u.id}>
              <div className="grid grid-cols-[1fr_160px_240px_40px] items-center gap-3 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-surface-alt text-[12px] font-semibold flex items-center justify-center">
                    {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
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

                <div className="flex flex-wrap items-center gap-1 text-[12px]">
                  {u.role === "super_admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      <ShieldCheck className="h-3 w-3" />
                      All HR (inherited)
                    </span>
                  ) : userModules.length === 0 && userGrants.length === 0 ? (
                    <span className="text-muted-foreground">No HR access</span>
                  ) : (
                    <>
                      {userModules.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {userModules.length} module
                          {userModules.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {userGrants.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                          <ShieldAlert className="h-3 w-3" />
                          {userGrants.length} scope
                          {userGrants.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </>
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
                  <HrAccessEditor
                    grantee={u}
                    grants={userGrants}
                    modules={userModules}
                    departments={departments}
                    employees={employees}
                    surveys={surveys}
                    onAddGrant={handleAddGrant}
                    onRemoveGrant={handleRevokeGrant}
                    onSetModules={handleSetModules}
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

function HrAccessEditor({
  grantee,
  grants,
  modules,
  departments,
  employees,
  surveys,
  onAddGrant,
  onRemoveGrant,
  onSetModules,
  pending,
}: {
  grantee: AdminUser;
  grants: HrAccessGrant[];
  modules: HrModuleGrant[];
  departments: Department[];
  employees: DbEmployee[];
  surveys: AdminSurveyOption[];
  onAddGrant: (
    granteeId: string,
    scope: HrGrantScope,
    target: { departmentId?: string; employeeId?: string; surveyId?: string },
  ) => void;
  onRemoveGrant: (id: string) => void;
  onSetModules: (granteeId: string, modules: HrModule[]) => void;
  pending: boolean;
}) {
  const [scope, setScope] = useState<HrGrantScope>("department");
  const [deptId, setDeptId] = useState<string>(departments[0]?.id ?? "");
  const [empId, setEmpId] = useState<string>(employees[0]?.id ?? "");
  const [surveyId, setSurveyId] = useState<string>(surveys[0]?.id ?? "");

  const enabledModules = new Set<HrModule>(modules.map((m) => m.module));

  const toggleModule = (m: HrModule) => {
    const next = new Set(enabledModules);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    onSetModules(grantee.id, Array.from(next));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[12px] font-semibold text-foreground/80">
        HR access for {grantee.full_name ?? grantee.email}
      </div>

      {/* Module access */}
      <div className="rounded-[6px] border border-border bg-surface p-3">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          HR sections this user can see
        </div>
        <div className="flex flex-wrap gap-2">
          {HR_MODULES.map((m) => {
            const on = enabledModules.has(m);
            return (
              <label
                key={m}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                  on
                    ? "border-emerald-400/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "border-border bg-surface-alt text-muted-foreground hover:bg-surface"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={pending}
                  onChange={() => toggleModule(m)}
                />
                {HR_MODULE_LABELS[m]}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Granting <strong>People</strong> shows the full directory; for a
          smaller scope, leave it off and add a per-department or per-employee
          grant below. <strong>Surveys</strong> grants every survey; leave it
          off to give per-survey access only.
        </p>
      </div>

      {/* Existing per-row grants */}
      {grants.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Per-row grants
          </div>
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
                  {g.scope === "survey" && (
                    <>
                      Survey: <strong>{g.survey_title ?? "—"}</strong>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveGrant(g.id)}
                  disabled={pending}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  aria-label="Remove grant"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add grant */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Add per-row grant
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-[6px] border border-dashed border-border bg-surface p-2">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as HrGrantScope)}
            className="rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px]"
          >
            <option value="all">All HR records (legacy)</option>
            <option value="department">Department</option>
            <option value="employee">Specific employee</option>
            <option value="survey">Specific survey</option>
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
                employees
                  .slice()
                  .sort((a, b) => {
                    const ad = (
                      a.department ??
                      departments.find((x) => x.id === a.department_id)?.name ??
                      ""
                    ).toLowerCase();
                    const bd = (
                      b.department ??
                      departments.find((x) => x.id === b.department_id)?.name ??
                      ""
                    ).toLowerCase();
                    if (ad !== bd) return ad.localeCompare(bd);
                    return a.full_name.localeCompare(b.full_name);
                  })
                  .map((e) => {
                    const deptName =
                      departments.find((d) => d.id === e.department_id)?.name ??
                      e.department ??
                      null;
                    return (
                      <option key={e.id} value={e.id}>
                        {e.full_name}
                        {deptName ? ` — ${deptName}` : ""}
                      </option>
                    );
                  })
              )}
            </select>
          )}

          {scope === "survey" && (
            <select
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              className="rounded-[6px] border border-border bg-surface px-2 py-1 text-[12px]"
            >
              {surveys.length === 0 ? (
                <option value="">(no surveys yet)</option>
              ) : (
                surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status})
                  </option>
                ))
              )}
            </select>
          )}

          <Button
            size="sm"
            onClick={() =>
              onAddGrant(grantee.id, scope, {
                departmentId: scope === "department" ? deptId : undefined,
                employeeId: scope === "employee" ? empId : undefined,
                surveyId: scope === "survey" ? surveyId : undefined,
              })
            }
            disabled={
              pending ||
              (scope === "department" && !deptId) ||
              (scope === "employee" && !empId) ||
              (scope === "survey" && !surveyId)
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Grant
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export icon component types for convenient consumers (currently unused
// outside this file, but stops `Shield`/`UserIcon` imports being flagged when
// the legacy code paths are removed).
export const _icons = { Shield, UserIcon };
