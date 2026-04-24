"use client";

import { useState, useTransition } from "react";
import { Building2, Plus, X, Archive, ArchiveRestore, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from "@/lib/admin/actions";

type Props = {
  initialDepartments: Department[];
};

export function DepartmentsCard({ initialDepartments }: Props) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Department name is required");
      return;
    }
    startTransition(async () => {
      try {
        const d = await createDepartment({ name });
        setDepartments((prev) =>
          [...prev, d].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
        );
        setNewName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleToggleArchive = (d: Department) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateDepartment(d.id, { archived: !d.archived });
        setDepartments((prev) =>
          prev.map((x) => (x.id === d.id ? { ...x, archived: !d.archived } : x)),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleDelete = (d: Department) => {
    if (
      !confirm(
        `Delete "${d.name}"? This will fail if any employees or HR grants reference it. Archiving is usually safer.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteDepartment(d.id);
        setDepartments((prev) => prev.filter((x) => x.id !== d.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setEditName(d.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) {
      setError("Name required");
      return;
    }
    const id = editingId;
    setError(null);
    startTransition(async () => {
      try {
        await updateDepartment(id, { name });
        setDepartments((prev) =>
          prev.map((x) => (x.id === id ? { ...x, name } : x)),
        );
        setEditingId(null);
        setEditName("");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-md bg-surface-alt p-2">
          <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-[15px] font-bold">Departments</h3>
          <p className="text-[12px] text-muted-foreground">
            A fixed list of departments. Used to tag employees and to scope HR
            access grants (e.g. &ldquo;Sarah can see all Housekeeping employees&rdquo;).
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] text-rose-700">
          {error}
        </div>
      )}

      <ul className="mb-4 flex flex-col divide-y divide-border rounded-[6px] border border-border">
        {departments.length === 0 && (
          <li className="px-3 py-3 text-[12px] text-muted-foreground">
            No departments yet.
          </li>
        )}
        {departments.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-2 px-3 py-2 text-[13px]"
          >
            {editingId === d.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 flex-1 text-[13px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditName("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={pending}
                  className="h-7 px-2"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditName("");
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-surface-alt"
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span
                  className={
                    d.archived
                      ? "flex-1 text-muted-foreground line-through"
                      : "flex-1 font-medium"
                  }
                >
                  {d.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {d.slug}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  disabled={pending}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-surface-alt"
                  aria-label="Rename"
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleArchive(d)}
                  disabled={pending}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-surface-alt"
                  aria-label={d.archived ? "Unarchive" : "Archive"}
                  title={d.archived ? "Unarchive" : "Archive"}
                >
                  {d.archived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d)}
                  disabled={pending}
                  className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                  aria-label="Delete"
                  title="Delete (will fail if in use)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New department name"
          className="h-8 flex-1 text-[13px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={pending || !newName.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </section>
  );
}
