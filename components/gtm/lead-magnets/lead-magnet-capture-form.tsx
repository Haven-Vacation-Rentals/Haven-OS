"use client";

import { useState, useTransition } from "react";
import {
  submitLeadMagnet,
  type LeadMagnet,
  type LeadMagnetCtaField,
} from "@/lib/gtm/lead-magnets/actions";

const LABELS: Record<LeadMagnetCtaField, string> = {
  name: "Your name",
  email: "Email",
  phone: "Phone",
  property_address: "Property address",
  message: "Message",
};

const TYPES: Record<LeadMagnetCtaField, string> = {
  name: "text",
  email: "email",
  phone: "tel",
  property_address: "text",
  message: "textarea",
};

export function LeadMagnetCaptureForm({ magnet }: { magnet: LeadMagnet }) {
  const fields: LeadMagnetCtaField[] =
    magnet.cta?.fields && magnet.cta.fields.length > 0
      ? magnet.cta.fields
      : ["name", "email"];
  const ctaLabel = magnet.cta?.label || "Get the guide";
  const successMessage =
    magnet.cta?.success_message ||
    "Thanks — we'll be in touch shortly.";

  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requireOne = fields.some((f) => f === "email" || f === "phone");
    if (requireOne && !values.email && !values.phone) {
      setError("Please share an email or phone number so we can reach you.");
      return;
    }

    startTransition(async () => {
      const r = await submitLeadMagnet({
        slug: magnet.slug,
        name: values.name,
        email: values.email,
        phone: values.phone,
        property_address: values.property_address,
        message: values.message,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        referrer:
          typeof document !== "undefined" ? document.referrer : undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF0EE]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF564E"
            strokeWidth="3"
            className="h-5 w-5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-heading text-[18px] font-bold uppercase tracking-[1.5px] text-haven-charcoal">
          You're in
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-haven-charcoal/80">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-heading text-[18px] font-bold uppercase tracking-[1.5px] text-haven-charcoal">
        {ctaLabel}
      </h3>

      {fields.map((f) => {
        const label = LABELS[f] ?? f;
        const inputType = TYPES[f] ?? "text";
        if (inputType === "textarea") {
          return (
            <label key={f} className="flex flex-col gap-1 text-[12px] font-semibold text-haven-charcoal/80">
              {label}
              <textarea
                value={values[f] ?? ""}
                onChange={(e) =>
                  setValues({ ...values, [f]: e.target.value })
                }
                rows={3}
                className="rounded-md border border-haven-charcoal/15 bg-white px-3 py-2 text-[14px] font-normal text-haven-charcoal focus:border-[#FF564E] focus:outline-none"
              />
            </label>
          );
        }
        return (
          <label
            key={f}
            className="flex flex-col gap-1 text-[12px] font-semibold text-haven-charcoal/80"
          >
            {label}
            <input
              type={inputType}
              value={values[f] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [f]: e.target.value })
              }
              required={f === "email" || f === "name"}
              className="h-10 rounded-md border border-haven-charcoal/15 bg-white px-3 text-[14px] font-normal text-haven-charcoal focus:border-[#FF564E] focus:outline-none"
            />
          </label>
        );
      })}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[30px] bg-[#FF564E] px-6 text-[13px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Sending…" : ctaLabel}
      </button>

      <p className="text-center text-[10.5px] uppercase tracking-[1.5px] text-haven-charcoal/50">
        We respect your inbox.
      </p>
    </form>
  );
}
