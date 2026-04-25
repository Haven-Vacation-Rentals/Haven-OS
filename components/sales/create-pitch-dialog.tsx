"use client";

/**
 * CreatePitchDialog — admin-facing modal to spin up a new property pitch.
 *
 * Flow:
 *  1. User pastes a Zillow / Airbnb / VRBO / Booking URL (optional)
 *  2. Click "Auto-fill" — server fetches the page and populates address /
 *     beds / baths / sleeps / hero. Anything we can't extract just stays
 *     blank for the user to fill in.
 *  3. User confirms owner name, projection range, optional note.
 *  4. Submit → /sales/pitches refreshes, modal closes, toast shows the
 *     public URL with a copy button.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Wand2,
  Megaphone,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  createPitch,
  extractListingDetails,
  type SalesListingSource,
} from "@/lib/sales/actions";

export function CreatePitchDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [extracting, setExtracting] = useState(false);

  // Form state
  const [listingUrl, setListingUrl] = useState("");
  const [listingSource, setListingSource] =
    useState<SalesListingSource>("other");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sleeps, setSleeps] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [projectionLow, setProjectionLow] = useState("");
  const [projectionHigh, setProjectionHigh] = useState("");
  const [projectionNote, setProjectionNote] = useState("");
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setListingUrl("");
    setListingSource("other");
    setOwnerName("");
    setOwnerEmail("");
    setPropertyAddress("");
    setBeds("");
    setBaths("");
    setSleeps("");
    setHeroImageUrl("");
    setProjectionLow("");
    setProjectionHigh("");
    setProjectionNote("");
    setExtractWarning(null);
    setError(null);
    setCreatedUrl(null);
    setCopied(false);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleAutoFill = async () => {
    if (!listingUrl.trim()) {
      setError("Paste a listing URL first.");
      return;
    }
    setError(null);
    setExtractWarning(null);
    setExtracting(true);
    try {
      const r = await extractListingDetails(listingUrl.trim());
      if (!r.ok) {
        setExtractWarning(r.error);
        return;
      }
      const e = r.data;
      setListingSource(e.source);
      if (e.property_address && !propertyAddress)
        setPropertyAddress(e.property_address);
      if (e.beds != null && !beds) setBeds(String(e.beds));
      if (e.baths != null && !baths) setBaths(String(e.baths));
      if (e.sleeps != null && !sleeps) setSleeps(String(e.sleeps));
      if (e.hero_image_url && !heroImageUrl)
        setHeroImageUrl(e.hero_image_url);
      if (!e.ok && e.reason) {
        setExtractWarning(e.reason);
      } else if (e.ok) {
        toast.success("Auto-filled what we could find");
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = () => {
    setError(null);
    if (!ownerName.trim()) return setError("Owner name is required.");
    if (!propertyAddress.trim())
      return setError("Property address is required.");
    const low = parseFloat(projectionLow);
    const high = parseFloat(projectionHigh);
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      return setError("Projection range is required (in dollars).");
    }
    if (high < low) {
      return setError("Projection high must be greater than or equal to low.");
    }

    startTransition(async () => {
      const r = await createPitch({
        owner_name: ownerName.trim(),
        owner_email: ownerEmail.trim() || undefined,
        property_address: propertyAddress.trim(),
        listing_url: listingUrl.trim() || undefined,
        listing_source: listingUrl.trim() ? listingSource : "other",
        beds: beds ? parseFloat(beds) : undefined,
        baths: baths ? parseFloat(baths) : undefined,
        sleeps: sleeps ? parseInt(sleeps, 10) : undefined,
        hero_image_url: heroImageUrl.trim() || undefined,
        projection_low: low,
        projection_high: high,
        projection_note: projectionNote.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const url = `${window.location.origin}/pitch/${r.data.slug}`;
      setCreatedUrl(url);
      toast.success("Pitch created");
      onCreated?.();
      router.refresh();
    });
  };

  const handleCopyCreated = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-haven-coral-600" />
            New property pitch
          </DialogTitle>
          <DialogDescription>
            Paste a listing URL, set a projection range, and we'll generate a
            personalized one-pager for the property owner. Pitches expire 30
            days after creation.
          </DialogDescription>
        </DialogHeader>

        {createdUrl ? (
          <CreatedSuccess
            url={createdUrl}
            copied={copied}
            onCopy={handleCopyCreated}
            onClose={() => close(false)}
          />
        ) : (
          <>
            {/* Listing URL + auto-fill */}
            <div className="rounded-card border border-border bg-surface-alt/30 p-3">
              <Field label="Listing URL" optional>
                <div className="flex gap-2">
                  <Input
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    placeholder="https://www.zillow.com/... or Airbnb / VRBO / Booking link"
                    disabled={pending || extracting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAutoFill}
                    disabled={pending || extracting || !listingUrl.trim()}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {extracting ? "Reading…" : "Auto-fill"}
                  </Button>
                </div>
              </Field>
              {extractWarning ? (
                <p className="mt-2 text-[12px] text-amber-700">
                  {extractWarning}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  We try to pull the address, beds/baths/sleeps, and a hero
                  photo. Airbnb often blocks bots — fill in manually if needed.
                </p>
              )}
            </div>

            {/* Owner */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner name">
                <Input
                  autoFocus
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Smith"
                  disabled={pending}
                />
              </Field>
              <Field label="Owner email" optional>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={pending}
                />
              </Field>
            </div>

            {/* Property */}
            <Field label="Property address">
              <Input
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Mountain View Dr, Pigeon Forge, TN 37863"
                disabled={pending}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Beds" optional>
                <Input
                  type="number"
                  step="0.5"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  placeholder="3"
                  disabled={pending}
                />
              </Field>
              <Field label="Baths" optional>
                <Input
                  type="number"
                  step="0.5"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                  placeholder="2.5"
                  disabled={pending}
                />
              </Field>
              <Field label="Sleeps" optional>
                <Input
                  type="number"
                  value={sleeps}
                  onChange={(e) => setSleeps(e.target.value)}
                  placeholder="8"
                  disabled={pending}
                />
              </Field>
            </div>

            <Field label="Hero image URL" optional>
              <Input
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="Auto-filled from listing — or paste your own"
                disabled={pending}
              />
            </Field>

            {/* Projection */}
            <div className="rounded-card border border-haven-coral/30 bg-accent-soft/30 p-3">
              <div className="haven-eyebrow text-haven-coral-700 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Annual gross revenue projection
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Low ($)">
                  <Input
                    type="number"
                    value={projectionLow}
                    onChange={(e) => setProjectionLow(e.target.value)}
                    placeholder="85000"
                    disabled={pending}
                  />
                </Field>
                <Field label="High ($)">
                  <Input
                    type="number"
                    value={projectionHigh}
                    onChange={(e) => setProjectionHigh(e.target.value)}
                    placeholder="110000"
                    disabled={pending}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Note" optional>
                  <Input
                    value={projectionNote}
                    onChange={(e) => setProjectionNote(e.target.value)}
                    placeholder="Based on comps within 1 mile, full year of bookings"
                    disabled={pending}
                  />
                </Field>
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                {error}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => close(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={pending}
              >
                {pending ? "Creating…" : "Create pitch"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedSuccess({
  url,
  copied,
  onCopy,
  onClose,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-emerald-700">
          Pitch ready
        </div>
        <p className="mt-1 text-[13px] text-emerald-800">
          Send this link to the property owner. It expires in 30 days.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 font-mono text-[12px] text-foreground">
          <span className="flex-1 truncate">{url}</span>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            title="Copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
            title="Open"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <DialogFooter>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {optional ? (
          <span className="ml-1 text-muted-foreground/70 normal-case font-normal">
            (optional)
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
