"use client";

/**
 * ListSettingsPanel — right-side panel for list settings.
 *
 * - Rename list
 * - Delete list
 * - Toggle list type (private/shared/public)
 * - Manage list members (add / remove)
 * - Manage statuses (opens StatusManagerDialog)
 * - Manage custom fields (opens CustomFieldsManagerDialog)
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Globe, Lock, Users2, Trash2, UserPlus, Check, Layers, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusManagerDialog } from "@/components/work/status-manager-dialog";
import { CustomFieldsManagerDialog } from "@/components/work/custom-fields-manager-dialog";
import {
  updateList,
  deleteList,
  updateListType,
  addListMember,
  removeListMember,
} from "@/lib/work/actions";
import type { List, ListType, Status, CustomFieldDef } from "@/lib/work/types";

// ---------------------------------------------------------------------------
// List type config
// ---------------------------------------------------------------------------

const LIST_TYPES: { value: ListType; label: string; icon: React.ReactNode }[] = [
  { value: "private", label: "Private", icon: <Lock className="h-3.5 w-3.5" /> },
  { value: "shared", label: "Shared", icon: <Users2 className="h-3.5 w-3.5" /> },
  { value: "public", label: "Public", icon: <Globe className="h-3.5 w-3.5" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListSettingsPanel({
  list,
  statuses: initialStatuses,
  fieldDefs: initialFieldDefs,
  members,
  onClose,
}: {
  list: List;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(list.name);
  const [, start] = useTransition();
  const [addQuery, setAddQuery] = useState("");
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const [fieldsManagerOpen, setFieldsManagerOpen] = useState(false);
  const [localStatuses, setLocalStatuses] = useState<Status[]>(initialStatuses);
  const [localFieldDefs, setLocalFieldDefs] = useState<CustomFieldDef[]>(initialFieldDefs);

  function handleRename() {
    const v = name.trim();
    if (!v || v === list.name) return;
    start(async () => {
      await updateList(list.id, { name: v });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete list "${list.name}"? All tasks in it will be removed.`)) return;
    start(async () => {
      await deleteList(list.id);
      router.push("/work");
    });
  }

  function handleTypeChange(type: ListType) {
    start(async () => {
      await updateListType(list.id, type);
      router.refresh();
    });
  }

  function handleAddMember(memberId: string) {
    start(async () => {
      await addListMember(list.id, memberId);
      router.refresh();
    });
    setAddQuery("");
  }

  function handleRemoveMember(memberId: string) {
    start(async () => {
      await removeListMember(list.id, memberId);
      router.refresh();
    });
  }

  const filteredMembers = members.filter((m) =>
    (m.full_name ?? "").toLowerCase().includes(addQuery.toLowerCase()),
  );

  return (
    <>
      <div className="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="flex-1 font-heading text-sm font-bold">List Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Rename */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleRename}>
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>

          {/* List type */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Visibility
            </label>
            <div className="flex gap-1.5">
              {LIST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    list.type === t.value
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-surface-alt hover:text-foreground",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Statuses section ─────────────────────────────────── */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Statuses
            </label>
            <div className="space-y-1.5 mb-2">
              {localStatuses.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px]"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                    {s.category}
                  </span>
                </div>
              ))}
              {localStatuses.length > 5 && (
                <p className="text-[11px] text-muted-foreground/60 px-2">
                  +{localStatuses.length - 5} more
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setStatusManagerOpen(true)}
            >
              <Layers className="h-3.5 w-3.5" />
              Manage statuses
            </Button>
          </section>

          {/* ── Custom Fields section ────────────────────────────── */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Custom Fields
            </label>
            <div className="space-y-1.5 mb-2">
              {localFieldDefs.length === 0 && (
                <p className="text-[12px] text-muted-foreground/50 px-2">
                  No custom fields yet
                </p>
              )}
              {localFieldDefs.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-[12px]"
                >
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                    {f.field_type}
                  </span>
                </div>
              ))}
              {localFieldDefs.length > 5 && (
                <p className="text-[11px] text-muted-foreground/60 px-2">
                  +{localFieldDefs.length - 5} more
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setFieldsManagerOpen(true)}
            >
              <ListFilter className="h-3.5 w-3.5" />
              Manage custom fields
            </Button>
          </section>

          {/* Members */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Members
            </label>

            <div className="relative mb-2">
              <UserPlus className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                placeholder="Add member by name…"
                className="h-8 pl-8 text-xs"
              />
            </div>

            {addQuery.trim() && (
              <div className="mb-3 max-h-40 overflow-y-auto rounded-md border border-border bg-surface-alt py-1">
                {filteredMembers.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No members found</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleAddMember(m.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold">
                        {(m.full_name ?? "?").slice(0, 1)}
                      </span>
                      <span className="truncate">{m.full_name ?? m.id.slice(0, 8)}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-surface-alt transition-colors"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold">
                    {(m.full_name ?? "?").slice(0, 1)}
                  </span>
                  <span className="flex-1 truncate text-foreground">
                    {m.full_name ?? m.id.slice(0, 8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-muted-foreground/50 hover:text-rose-500 transition-colors"
                    title="Remove from list"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground/50 px-2">No members yet</p>
              )}
            </div>
          </section>

          {/* Danger zone */}
          <section>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-rose-500">
              Danger Zone
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="w-full justify-start gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete list
            </Button>
          </section>
        </div>
      </div>

      {/* Dialogs */}
      <StatusManagerDialog
        open={statusManagerOpen}
        onOpenChange={setStatusManagerOpen}
        listId={list.id}
        statuses={localStatuses}
        onStatusesChange={setLocalStatuses}
      />

      <CustomFieldsManagerDialog
        open={fieldsManagerOpen}
        onOpenChange={setFieldsManagerOpen}
        listId={list.id}
        fieldDefs={localFieldDefs}
        onFieldDefsChange={setLocalFieldDefs}
      />
    </>
  );
}
