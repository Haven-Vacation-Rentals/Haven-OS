"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProjectFromTemplate } from "@/lib/onboarding/actions";

export function NewProjectForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    property_nickname: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    start_date: "",
    target_open_date: "",
    slack_channel: "",
    owner_profile_folder_url: "",
    notes: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_nickname.trim()) {
      toast.error("Property nickname is required");
      return;
    }
    startTransition(async () => {
      try {
        const project = await createProjectFromTemplate({
          property_nickname: form.property_nickname,
          owner_name: form.owner_name || undefined,
          owner_email: form.owner_email || undefined,
          owner_phone: form.owner_phone || undefined,
          start_date: form.start_date || undefined,
          target_open_date: form.target_open_date || undefined,
          slack_channel: form.slack_channel || undefined,
          owner_profile_folder_url: form.owner_profile_folder_url || undefined,
          notes: form.notes || undefined,
        });
        toast.success("Project created with full template");
        router.push(`/onboarding/${project.id}` as never);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create project";
        toast.error(msg);
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="haven-card rounded-card p-6 flex flex-col gap-4"
    >
      <Field label="Property nickname" required>
        <Input
          value={form.property_nickname}
          onChange={(e) => setForm({ ...form, property_nickname: e.target.value })}
          placeholder="e.g. John Kuvshinikov 2948"
          required
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Owner name">
          <Input
            value={form.owner_name}
            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          />
        </Field>
        <Field label="Owner email">
          <Input
            type="email"
            value={form.owner_email}
            onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
          />
        </Field>
        <Field label="Owner phone">
          <Input
            value={form.owner_phone}
            onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
          />
        </Field>
        <Field label="Slack channel">
          <Input
            value={form.slack_channel}
            onChange={(e) => setForm({ ...form, slack_channel: e.target.value })}
            placeholder="#onboarding-property-name"
          />
        </Field>
        <Field label="Start date">
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </Field>
        <Field label="Target open date">
          <Input
            type="date"
            value={form.target_open_date}
            onChange={(e) => setForm({ ...form, target_open_date: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Owner Profile folder (Google Drive URL)">
        <Input
          value={form.owner_profile_folder_url}
          onChange={(e) =>
            setForm({ ...form, owner_profile_folder_url: e.target.value })
          }
          placeholder="https://drive.google.com/..."
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-ring"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-haven-coral-700">*</span> : null}
      </span>
      {children}
    </label>
  );
}
