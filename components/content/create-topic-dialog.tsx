"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
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
  AD_FORMATS,
  CHANNEL_LABELS,
  PRIORITY_LABELS,
  type AdChannel,
  type ContentAssignee,
  type ContentPriority,
} from "@/lib/content/types";

const SELF_OWNER = "__self__";

export function CreateTopicDialog({
  open,
  onOpenChange,
  spaceId,
  assignees,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  spaceId: string;
  assignees: ContentAssignee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<AdChannel>("meta");
  const [priority, setPriority] = useState<ContentPriority>("medium");
  const [adFormat, setAdFormat] = useState("");
  const [budget, setBudget] = useState("");
  const [hook, setHook] = useState("");
  const [angle, setAngle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [launchTarget, setLaunchTarget] = useState("");
  const [ownerId, setOwnerId] = useState<string>(SELF_OWNER);

  function reset() {
    setTitle("");
    setChannel("meta");
    setPriority("medium");
    setAdFormat("");
    setBudget("");
    setHook("");
    setAngle("");
    setDueDate("");
    setLaunchTarget("");
    setOwnerId(SELF_OWNER);
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Ad name is required");
      return;
    }
    startTransition(async () => {
      // Sentinel SELF_OWNER → leave owner_id undefined so the action
      // defaults to the creator. Empty string → explicit unassigned.
      const ownerArg =
        ownerId === SELF_OWNER
          ? undefined
          : ownerId === ""
            ? null
            : ownerId;
      const result = await createTopic({
        space_id: spaceId,
        title: title.trim(),
        channel,
        priority,
        ad_format: adFormat || undefined,
        budget: budget.trim() || undefined,
        hook: hook.trim() || undefined,
        angle: angle.trim() || undefined,
        due_date: dueDate || null,
        publish_target: launchTarget || null,
        owner_id: ownerArg,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Ad created");
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
            <Megaphone className="h-4 w-4 text-haven-coral" />
            New ad
          </DialogTitle>
          <DialogDescription>
            Drop the idea, pick a channel, and the studio spins up a script
            shell you can write and customize.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Ad name">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gatlinburg Fall Getaway — Meta Reel"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select
                value={channel}
                onChange={(v) => setChannel(v as AdChannel)}
                options={Object.entries(CHANNEL_LABELS).map(([v, l]) => ({
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Format">
              <Select
                value={adFormat}
                onChange={(v) => setAdFormat(v)}
                options={[
                  { value: "", label: "— Not set —" },
                  ...AD_FORMATS.map((f) => ({ value: f, label: f })),
                ]}
              />
            </Field>
            <Field label="Budget">
              <Input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $50/day"
              />
            </Field>
          </div>

          <Field label="Assignee">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface px-2 text-[13px] text-foreground"
            >
              <option value={SELF_OWNER}>Me (default)</option>
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Hook">
            <Input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="The first 3 seconds — what stops the scroll?"
            />
          </Field>

          <Field label="Angle">
            <Input
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="What's the creative angle / offer?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Draft due">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Launch date">
              <Input
                type="date"
                value={launchTarget}
                onChange={(e) => setLaunchTarget(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Creating…" : "Create ad"}
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
