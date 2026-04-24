"use client";

/**
 * ProjectHero — editable project header for the detail page.
 *
 * Inline-editable fields: nickname, owner name/email/phone, slack channel,
 * folder URL, start/target/actual dates. Project status via ProjectStatusMenu.
 * Shows progress ring + stage pipeline + stat tiles.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Mail,
  Phone,
  Folder,
  MessageSquare,
  User,
  Pencil,
  Check,
  X,
  Star,
  Flag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectStatusMenu } from "@/components/onboarding/status-menu";
import type {
  DbOnboardingProject,
  OnboardingProjectTree,
} from "@/lib/onboarding/types";
import {
  PROJECT_PIPELINE,
  formatDate,
  isOffPipeline,
  pipelineIndex,
} from "@/lib/onboarding/utils";
import { updateProject } from "@/lib/onboarding/actions";

type Totals = OnboardingProjectTree["totals"];

export function ProjectHero({
  project,
  totals,
}: {
  project: DbOnboardingProject;
  totals: Totals;
}) {
  const [pending, startTransition] = useTransition();

  const save = (
    patch: Partial<DbOnboardingProject>,
    successMsg = "Saved",
  ) => {
    startTransition(async () => {
      try {
        await updateProject(project.id, patch);
        toast.success(successMsg);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="haven-card rounded-card p-6 flex flex-col gap-5">
      {/* Title + status + progress ring */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <InlineText
              value={project.property_nickname}
              onSave={(v) =>
                save({ property_nickname: v }, "Nickname updated")
              }
              className="font-heading text-2xl font-bold"
              placeholder="Property nickname"
              required
            />
            <ProjectStatusMenu
              value={project.status}
              onChange={(s) => save({ status: s }, "Status updated")}
              disabled={pending}
            />
          </div>

          {/* Stage pipeline */}
          <div className="mt-3">
            {isOffPipeline(project.status) ? (
              <p className="text-xs text-muted-foreground">
                Project is off the active pipeline.
              </p>
            ) : (
              <StagePipeline statusIdx={pipelineIndex(project.status)} />
            )}
          </div>
        </div>
        <ProgressRing percent={totals.percentComplete} />
      </div>

      {/* Editable meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <EditableRow
          icon={<User className="h-3.5 w-3.5" />}
          label="Owner name"
          value={project.owner_name ?? ""}
          onSave={(v) => save({ owner_name: v || null })}
        />
        <EditableRow
          icon={<Mail className="h-3.5 w-3.5" />}
          label="Owner email"
          value={project.owner_email ?? ""}
          onSave={(v) => save({ owner_email: v || null })}
          type="email"
        />
        <EditableRow
          icon={<Phone className="h-3.5 w-3.5" />}
          label="Owner phone"
          value={project.owner_phone ?? ""}
          onSave={(v) => save({ owner_phone: v || null })}
        />
        <EditableRow
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Slack channel"
          value={project.slack_channel ?? ""}
          onSave={(v) => save({ slack_channel: v || null })}
          placeholder="#channel"
        />
        <EditableRow
          icon={<Folder className="h-3.5 w-3.5" />}
          label="Owner profile folder"
          value={project.owner_profile_folder_url ?? ""}
          onSave={(v) => save({ owner_profile_folder_url: v || null })}
          link
          placeholder="https://…"
        />
        <div /> {/* filler */}
        <EditableRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Start date"
          value={project.start_date ?? ""}
          onSave={(v) => save({ start_date: v || null })}
          type="date"
          displayAsDate
        />
        <EditableRow
          icon={<Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
          label="Target open"
          value={project.target_open_date ?? ""}
          onSave={(v) => save({ target_open_date: v || null })}
          type="date"
          displayAsDate
        />
        <EditableRow
          icon={<Flag className="h-3.5 w-3.5 text-emerald-600" />}
          label="Actual open"
          value={project.actual_open_date ?? ""}
          onSave={(v) => save({ actual_open_date: v || null })}
          type="date"
          displayAsDate
        />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatTile label="Total" value={totals.total} />
        <StatTile label="Done" value={totals.done} tone="success" />
        <StatTile label="In Progress" value={totals.inProgress} tone="warn" />
        <StatTile label="Blocked" value={totals.blocked} tone="danger" />
        <StatTile label="Not Started" value={totals.notStarted} />
        <StatTile
          label="Key Dates"
          value={`${totals.keyDatesDone}/${totals.keyDatesTotal}`}
          tone="coral"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline rail
// ---------------------------------------------------------------------------

function StagePipeline({ statusIdx }: { statusIdx: number }) {
  return (
    <div className="flex items-stretch gap-2">
      {PROJECT_PIPELINE.map((stage, i) => {
        const reached = i <= statusIdx;
        const current = i === statusIdx;
        return (
          <div key={stage.key} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={
                  "h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold shrink-0 " +
                  (current
                    ? "bg-haven-coral-600 text-white"
                    : reached
                    ? "bg-emerald-500 text-white"
                    : "bg-surface-alt text-foreground/60")
                }
              >
                {reached ? (
                  i === statusIdx ? (
                    <span>{i + 1}</span>
                  ) : (
                    <Check className="h-3 w-3" />
                  )
                ) : (
                  i + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={
                    "text-[11px] font-semibold truncate " +
                    (current ? "text-foreground" : "text-muted-foreground")
                  }
                >
                  {stage.label}
                </div>
              </div>
            </div>
            <div
              className={
                "mt-1.5 h-1 rounded-full " +
                (current
                  ? "bg-haven-coral-600"
                  : reached
                  ? "bg-emerald-500"
                  : "bg-surface-alt")
              }
            />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress ring + stat tiles
// ---------------------------------------------------------------------------

function ProgressRing({ percent }: { percent: number }) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const offset = C - (percent / 100) * C;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={R}
          strokeWidth="6"
          className="stroke-surface-alt"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={R}
          strokeWidth="6"
          className="stroke-accent"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-lg font-bold">{percent}%</span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warn" | "danger" | "coral";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "danger"
      ? "text-rose-700"
      : tone === "coral"
      ? "text-haven-coral-700"
      : "text-foreground";
  return (
    <div className="rounded-card border border-border bg-surface-alt/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-heading text-lg font-bold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline editable primitives
// ---------------------------------------------------------------------------

function InlineText({
  value,
  onSave,
  className,
  placeholder,
  required,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={
          "group inline-flex items-center gap-1.5 rounded-md px-1 -ml-1 hover:bg-surface-alt text-left " +
          (className ?? "")
        }
      >
        <span className="truncate">{value || placeholder || "—"}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60" />
      </button>
    );
  }

  const commit = () => {
    const v = draft.trim();
    if (required && !v) {
      setEditing(false);
      return;
    }
    if (v !== value) onSave(v);
    setEditing(false);
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className={
        "rounded-md border border-border bg-surface px-2 py-0.5 outline-none focus:border-foreground/30 " +
        (className ?? "")
      }
      placeholder={placeholder}
    />
  );
}

function EditableRow({
  icon,
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  link,
  displayAsDate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: "text" | "email" | "date";
  placeholder?: string;
  link?: boolean;
  displayAsDate?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const v = draft.trim();
    if (v !== value) onSave(v);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const displayValue = displayAsDate ? formatDate(value || null) : value;

  return (
    <div className="rounded-card border border-border bg-surface-alt/30 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            placeholder={placeholder}
            className="h-8 text-[13px]"
          />
          <button
            type="button"
            onClick={commit}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-surface-alt text-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={cancel}
            className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-surface-alt text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="group w-full flex items-center gap-1.5 text-left text-sm text-foreground hover:text-foreground min-h-[1.75rem]"
        >
          {value ? (
            link ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </a>
            ) : (
              <span className="truncate">{displayValue}</span>
            )
          ) : (
            <span className="text-muted-foreground italic">
              {placeholder || "Click to add"}
            </span>
          )}
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 ml-auto shrink-0" />
        </button>
      )}
    </div>
  );
}
