"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCandidate, updateCandidate } from "@/lib/hr/actions";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_LABELS,
  type DbCandidate,
} from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roleId: string;
  candidate?: DbCandidate | null;
};

export function CandidateEditor({ open, onOpenChange, roleId, candidate }: Props) {
  const editing = !!candidate;
  const [name, setName] = useState(candidate?.name ?? "");
  const [email, setEmail] = useState(candidate?.email ?? "");
  const [phone, setPhone] = useState(candidate?.phone ?? "");
  const [resumeUrl, setResumeUrl] = useState(candidate?.resume_url ?? "");
  const [loomUrl, setLoomUrl] = useState(candidate?.loom_url ?? "");
  const [stage, setStage] = useState(candidate?.stage ?? "applied");
  const [notes, setNotes] = useState(candidate?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing && candidate) {
          await updateCandidate(
            candidate.id,
            {
              name,
              email: email || null,
              phone: phone || null,
              resume_url: resumeUrl || null,
              loom_url: loomUrl || null,
              stage,
              notes,
            },
            roleId,
          );
        } else {
          await createCandidate({
            role_id: roleId,
            name,
            email,
            phone,
            resume_url: resumeUrl,
            loom_url: loomUrl,
            stage,
            notes,
            source: "manual",
          });
        }
        onOpenChange(false);
        if (!editing) {
          setName("");
          setEmail("");
          setPhone("");
          setResumeUrl("");
          setLoomUrl("");
          setStage("applied");
          setNotes("");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit candidate" : "Add candidate"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Stage">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {CANDIDATE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {CANDIDATE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Resume URL">
              <Input
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Video intro URL">
              <Input
                value={loomUrl}
                onChange={(e) => setLoomUrl(e.target.value)}
                placeholder="https://www.loom.com/share/…"
                type="url"
                inputMode="url"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add candidate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
