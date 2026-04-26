"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
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
import { createTopic } from "@/lib/content/actions";
import {
  PILLAR_LABELS,
  PRIORITY_LABELS,
  type ContentPillar,
  type ContentPriority,
} from "@/lib/content/types";

export function CreateTopicDialog({
  open,
  onOpenChange,
  spaceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spaceId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<ContentPillar>("market_data");
  const [priority, setPriority] = useState<ContentPriority>("medium");
  const [keyword, setKeyword] = useState("");
  const [angle, setAngle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [publishTarget, setPublishTarget] = useState("");

  function reset() {
    setTitle("");
    setPillar("market_data");
    setPriority("medium");
    setKeyword("");
    setAngle("");
    setHypothesis("");
    setDueDate("");
    setPublishTarget("");
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      const result = await createTopic({
        space_id: spaceId,
        title: title.trim(),
        pillar,
        priority,
        target_keyword: keyword.trim() || undefined,
        angle: angle.trim() || undefined,
        hypothesis: hypothesis.trim() || undefined,
        due_date: dueDate || null,
        publish_target: publishTarget || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Topic created");
      reset();
      onOpenChange(false);
      router.push(`/content/${result.data.id}` as never);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-haven-coral" />
            New topic
          </DialogTitle>
          <DialogDescription>
            Drop the working title and the angle. The studio will spin up a
            draft article shell and the agent will help fill it in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Working title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smoky Mountains Cabin Revenue Outlook"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pillar">
              <Select
                value={pillar}
                onChange={(v) => setPillar(v as ContentPillar)}
                options={Object.entries(PILLAR_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={priority}
                onChange={(v) => setPriority(v as ContentPriority)}
                options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
            </Field>
          </div>

          <Field label="Target keyword">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. smoky mountains cabin rental income"
            />
          </Field>

          <Field label="Angle">
            <Input
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="What makes this post non-generic?"
            />
          </Field>

          <Field label="Hypothesis">
            <Input
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="What's the operator-level take?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Publish target">
              <Input
                type="date"
                value={publishTarget}
                onChange={(e) => setPublishTarget(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Creating…" : "Create topic"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border bg-surface px-2 text-[13px] text-foreground"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
