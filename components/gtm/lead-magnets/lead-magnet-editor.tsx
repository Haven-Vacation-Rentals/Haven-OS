"use client";

/**
 * LeadMagnetEditor — internal /gtm/lead-magnets/[id] editor.
 *
 * Lets Jack edit:
 *   - Identity (eyebrow, title, subtitle, hero image)
 *   - Status (draft/active/archived) + expiration
 *   - CTA (label + which capture fields to ask for)
 *   - Content sections (rich_text / bullets / faq / stat_band / cta_block)
 *   - Owner contact
 *
 * It also shows a feed of submissions captured from the public page.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  Check,
  Trash2,
  Plus,
  GripVertical,
  Save,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canonicalUrl } from "@/lib/canonical-url";
import {
  updateLeadMagnet,
  type LeadMagnet,
  type LeadMagnetSection,
  type LeadMagnetSubmission,
  type LeadMagnetCta,
  type LeadMagnetCtaField,
} from "@/lib/gtm/lead-magnets/actions";

const TEXTAREA_CLS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:shadow-ring";
const SELECT_CLS =
  "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:shadow-ring";

const ALL_FIELDS: LeadMagnetCtaField[] = [
  "name",
  "email",
  "phone",
  "property_address",
  "message",
];

const SECTION_KINDS: { kind: string; label: string; template: () => LeadMagnetSection }[] = [
  {
    kind: "rich_text",
    label: "Rich text",
    template: () => ({ kind: "rich_text", body_md: "" }),
  },
  {
    kind: "bullets",
    label: "Bullet list",
    template: () => ({ kind: "bullets", heading: "", items: [""] }),
  },
  {
    kind: "stat_band",
    label: "Stat band",
    template: () => ({
      kind: "stat_band",
      stats: [{ value: "", label: "" }],
    }),
  },
  {
    kind: "faq",
    label: "FAQ",
    template: () => ({ kind: "faq", items: [{ q: "", a: "" }] }),
  },
  {
    kind: "cta_block",
    label: "CTA block",
    template: () => ({
      kind: "cta_block",
      heading: "",
      body: "",
    }),
  },
];

export function LeadMagnetEditor({
  magnet,
  submissions,
}: {
  magnet: LeadMagnet;
  submissions: LeadMagnetSubmission[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(magnet.title);
  const [eyebrow, setEyebrow] = useState(magnet.eyebrow ?? "");
  const [subtitle, setSubtitle] = useState(magnet.subtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(magnet.hero_image_url ?? "");
  const [ownerName, setOwnerName] = useState(magnet.owner_name ?? "");
  const [ownerEmail, setOwnerEmail] = useState(magnet.owner_email ?? "");
  const [status, setStatus] = useState(magnet.status);
  const [expiresAt, setExpiresAt] = useState(
    new Date(magnet.expires_at).toISOString().slice(0, 10),
  );
  const [cta, setCta] = useState<LeadMagnetCta>(magnet.cta);
  const [content, setContent] = useState<LeadMagnetSection[]>(magnet.content);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(
    () => canonicalUrl(`/lead-magnet/${magnet.slug}`),
    [magnet.slug],
  );

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      const r = await updateLeadMagnet(magnet.id, {
        title: title.trim(),
        eyebrow: eyebrow.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        hero_image_url: heroImageUrl.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        owner_email: ownerEmail.trim() || undefined,
        status,
        expires_at: new Date(expiresAt + "T23:59:59Z").toISOString(),
        cta,
        content,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Public URL copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left column — editor */}
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="haven-eyebrow text-haven-coral">GTM · Lead Magnet</div>
            <h1 className="mt-1 font-heading text-display-3 text-foreground">
              {title || "Untitled"}
            </h1>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-surface-alt/40 px-2.5 py-1.5 text-[12px] text-muted-foreground">
              <code className="text-haven-coral-700">{publicUrl}</code>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface hover:text-foreground"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface hover:text-foreground"
                title="Open"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={pending}
            >
              <Save className="h-4 w-4" />
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </header>

        {/* Identity */}
        <Section title="Identity">
          <Field label="Eyebrow">
            <Input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="Free guide"
            />
          </Field>
          <Field label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Smoky Mountain STR Owner's Playbook"
            />
          </Field>
          <Field label="Subtitle">
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Field>
          <Field label="Hero image URL">
            <Input
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </Section>

        {/* Content */}
        <Section title="Content sections">
          <p className="text-[12.5px] text-muted-foreground">
            Add as many sections as you need. The public page renders them in
            order.
          </p>

          <div className="flex flex-col gap-3">
            {content.map((section, idx) => (
              <SectionEditor
                key={idx}
                section={section}
                onChange={(next) =>
                  setContent((prev) => {
                    const copy = [...prev];
                    copy[idx] = next;
                    return copy;
                  })
                }
                onRemove={() =>
                  setContent((prev) => prev.filter((_, i) => i !== idx))
                }
                onMoveUp={
                  idx > 0
                    ? () =>
                        setContent((prev) => {
                          const copy = [...prev];
                          [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                          return copy;
                        })
                    : undefined
                }
                onMoveDown={
                  idx < content.length - 1
                    ? () =>
                        setContent((prev) => {
                          const copy = [...prev];
                          [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                          return copy;
                        })
                    : undefined
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[12px] font-semibold text-muted-foreground">
              Add section:
            </span>
            {SECTION_KINDS.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() =>
                  setContent((prev) => [...prev, s.template()])
                }
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-alt/40 px-2 py-1 text-[12px] font-semibold hover:bg-surface-alt"
              >
                <Plus className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section title="CTA / capture form">
          <Field label="CTA label">
            <Input
              value={cta.label}
              onChange={(e) => setCta({ ...cta, label: e.target.value })}
            />
          </Field>
          <Field label="CTA type">
            <select
              className={SELECT_CLS}
              value={cta.type}
              onChange={(e) =>
                setCta({
                  ...cta,
                  type: e.target.value as LeadMagnetCta["type"],
                })
              }
            >
              <option value="form">Capture form</option>
              <option value="link">External link</option>
            </select>
          </Field>
          {cta.type === "link" ? (
            <Field label="Link URL">
              <Input
                value={cta.href ?? ""}
                onChange={(e) => setCta({ ...cta, href: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          ) : (
            <Field label="Capture fields">
              <div className="flex flex-wrap gap-2">
                {ALL_FIELDS.map((f) => {
                  const checked = (cta.fields ?? []).includes(f);
                  return (
                    <label
                      key={f}
                      className={
                        "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[12px] " +
                        (checked
                          ? "border-haven-coral bg-accent-soft text-haven-coral-700"
                          : "border-border bg-surface text-muted-foreground")
                      }
                    >
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        checked={checked}
                        onChange={(e) => {
                          const cur = new Set(cta.fields ?? []);
                          if (e.target.checked) cur.add(f);
                          else cur.delete(f);
                          setCta({
                            ...cta,
                            fields: Array.from(cur) as LeadMagnetCtaField[],
                          });
                        }}
                      />
                      {f.replace(/_/g, " ")}
                    </label>
                  );
                })}
              </div>
            </Field>
          )}
          <Field label="Success message" hint="Shown after the form is submitted.">
            <Input
              value={cta.success_message ?? ""}
              onChange={(e) =>
                setCta({ ...cta, success_message: e.target.value })
              }
              placeholder="Thanks — we'll be in touch shortly."
            />
          </Field>
        </Section>

        {/* Lifecycle */}
        <Section title="Lifecycle">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                className={SELECT_CLS}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as LeadMagnet["status"])
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active (public URL live)</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Expires on">
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Owner */}
        <Section title="Owner / contact">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                type="email"
              />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Right column — submissions */}
      <aside className="flex flex-col gap-3">
        <div className="rounded-card border border-border bg-surface px-4 py-3">
          <div className="haven-eyebrow text-muted-foreground">Engagement</div>
          <div className="mt-2 flex items-center gap-4">
            <Stat label="Views" value={magnet.view_count} />
            <Stat label="Submissions" value={magnet.submission_count} />
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="haven-eyebrow text-muted-foreground">
              Submissions
            </div>
            <span className="text-[11px] text-muted-foreground">
              {submissions.length}
            </span>
          </div>
          {submissions.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
              <Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
              No submissions yet.
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-border overflow-auto">
              {submissions.map((s) => (
                <li key={s.id} className="px-4 py-3 text-[12.5px]">
                  <div className="font-semibold text-foreground">
                    {s.name || s.email || "(anonymous)"}
                  </div>
                  {s.email ? (
                    <div className="text-muted-foreground">{s.email}</div>
                  ) : null}
                  {s.phone ? (
                    <div className="text-muted-foreground">{s.phone}</div>
                  ) : null}
                  {s.property_address ? (
                    <div className="text-muted-foreground">
                      {s.property_address}
                    </div>
                  ) : null}
                  {s.message ? (
                    <div className="mt-1 whitespace-pre-wrap text-foreground/80">
                      {s.message}
                    </div>
                  ) : null}
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground/70">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="font-heading text-[15px] font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground">
      <span>
        {label}
        {required ? <span className="ml-1 text-haven-coral">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="text-[11.5px] font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-heading text-display-4 text-foreground tabular-nums">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section editor — picks the right inline editor for each section kind.
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: LeadMagnetSection;
  onChange: (next: LeadMagnetSection) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const kind = section.kind as string;
  return (
    <div className="rounded-md border border-border bg-surface-alt/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
            {kind.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp ? (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded px-1.5 text-[11px] text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              ↑
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              onClick={onMoveDown}
              className="rounded px-1.5 text-[11px] text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              ↓
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
            title="Remove section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {kind === "rich_text" ? (
        <textarea
          className={`${TEXTAREA_CLS} min-h-[100px] resize-y`}
          value={(section.body_md as string) ?? ""}
          onChange={(e) => onChange({ ...section, body_md: e.target.value })}
          placeholder="Markdown supported. Headings, lists, **bold**, *italic*, [links](https://…), etc."
        />
      ) : kind === "bullets" ? (
        <BulletsEditor section={section} onChange={onChange} />
      ) : kind === "stat_band" ? (
        <StatBandEditor section={section} onChange={onChange} />
      ) : kind === "faq" ? (
        <FaqEditor section={section} onChange={onChange} />
      ) : kind === "cta_block" ? (
        <CtaBlockEditor section={section} onChange={onChange} />
      ) : (
        <textarea
          className={`${TEXTAREA_CLS} min-h-[80px] resize-y font-mono text-[12px]`}
          value={JSON.stringify(section, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              /* keep typing */
            }
          }}
        />
      )}
    </div>
  );
}

function BulletsEditor({
  section,
  onChange,
}: {
  section: LeadMagnetSection;
  onChange: (s: LeadMagnetSection) => void;
}) {
  const items = Array.isArray(section.items) ? (section.items as string[]) : [];
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={(section.heading as string) ?? ""}
        onChange={(e) => onChange({ ...section, heading: e.target.value })}
        placeholder="Section heading (optional)"
      />
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={it}
            onChange={(e) => {
              const copy = [...items];
              copy[i] = e.target.value;
              onChange({ ...section, items: copy });
            }}
            placeholder={`Bullet ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => {
              const copy = items.filter((_, idx) => idx !== i);
              onChange({ ...section, items: copy });
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...section, items: [...items, ""] })}
        className="self-start rounded-md border border-border bg-surface-alt/40 px-2 py-1 text-[12px] font-semibold hover:bg-surface-alt"
      >
        + Add bullet
      </button>
    </div>
  );
}

function StatBandEditor({
  section,
  onChange,
}: {
  section: LeadMagnetSection;
  onChange: (s: LeadMagnetSection) => void;
}) {
  type Stat = { value: string; label: string };
  const stats = Array.isArray(section.stats) ? (section.stats as Stat[]) : [];
  return (
    <div className="flex flex-col gap-2">
      {stats.map((st, i) => (
        <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
          <Input
            value={st.value ?? ""}
            onChange={(e) => {
              const copy = [...stats];
              copy[i] = { ...copy[i], value: e.target.value };
              onChange({ ...section, stats: copy });
            }}
            placeholder="42%"
          />
          <Input
            value={st.label ?? ""}
            onChange={(e) => {
              const copy = [...stats];
              copy[i] = { ...copy[i], label: e.target.value };
              onChange({ ...section, stats: copy });
            }}
            placeholder="more bookings"
          />
          <button
            type="button"
            onClick={() => {
              const copy = stats.filter((_, idx) => idx !== i);
              onChange({ ...section, stats: copy });
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...section,
            stats: [...stats, { value: "", label: "" }],
          })
        }
        className="self-start rounded-md border border-border bg-surface-alt/40 px-2 py-1 text-[12px] font-semibold hover:bg-surface-alt"
      >
        + Add stat
      </button>
    </div>
  );
}

function FaqEditor({
  section,
  onChange,
}: {
  section: LeadMagnetSection;
  onChange: (s: LeadMagnetSection) => void;
}) {
  type Item = { q: string; a: string };
  const items = Array.isArray(section.items) ? (section.items as Item[]) : [];
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Input
            value={item.q ?? ""}
            onChange={(e) => {
              const copy = [...items];
              copy[i] = { ...copy[i], q: e.target.value };
              onChange({ ...section, items: copy });
            }}
            placeholder="Question"
          />
          <textarea
            className={`${TEXTAREA_CLS} min-h-[60px] resize-y`}
            value={item.a ?? ""}
            onChange={(e) => {
              const copy = [...items];
              copy[i] = { ...copy[i], a: e.target.value };
              onChange({ ...section, items: copy });
            }}
            placeholder="Answer"
          />
          <button
            type="button"
            onClick={() => {
              const copy = items.filter((_, idx) => idx !== i);
              onChange({ ...section, items: copy });
            }}
            className="self-end inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-600"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...section,
            items: [...items, { q: "", a: "" }],
          })
        }
        className="self-start rounded-md border border-border bg-surface-alt/40 px-2 py-1 text-[12px] font-semibold hover:bg-surface-alt"
      >
        + Add Q&amp;A
      </button>
    </div>
  );
}

function CtaBlockEditor({
  section,
  onChange,
}: {
  section: LeadMagnetSection;
  onChange: (s: LeadMagnetSection) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={(section.heading as string) ?? ""}
        onChange={(e) => onChange({ ...section, heading: e.target.value })}
        placeholder="Heading"
      />
      <textarea
        className={`${TEXTAREA_CLS} min-h-[60px] resize-y`}
        value={(section.body as string) ?? ""}
        onChange={(e) => onChange({ ...section, body: e.target.value })}
        placeholder="Body copy"
      />
    </div>
  );
}
