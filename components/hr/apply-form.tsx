"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitApplication } from "@/lib/hr/public";

type Props = { roleId: string; roleSlug: string };

export function ApplyForm({ roleId, roleSlug }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Valid email is required");
      return;
    }
    startTransition(async () => {
      try {
        await submitApplication({
          role_id: roleId,
          role_slug: roleSlug,
          name,
          email,
          phone,
          resume_url: resumeUrl,
          cover_letter: coverLetter,
        });
        setSubmitted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        <div>
          <div className="font-heading text-[18px] font-bold">Application received</div>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Thanks for applying. If it's a fit, someone from Haven will reach out to {email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Full name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email" required>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </Field>
      <Field label="Resume URL">
        <Input
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="Google Drive, Dropbox, LinkedIn…"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Why you?">
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
            placeholder="A short note about why you're a fit for this role."
            className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
          />
        </Field>
      </div>
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400 sm:col-span-2">
          {error}
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" variant="cta" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Submitting…" : "Submit application"}
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
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
