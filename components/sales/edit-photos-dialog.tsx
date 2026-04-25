"use client";

/**
 * EditPhotosDialog — quick inline editor that lets an admin replace the
 * hero photo and gallery URLs for an existing pitch without recreating it.
 *
 * Mounted from the pitches list "Edit photos" action, this is the
 * fastest path to fix a pitch whose listing site (looking at you,
 * Airbnb) blocked our auto-fill at create time.
 */

import { useEffect, useState, useTransition } from "react";
import { ImageIcon, ImagePlus, X } from "lucide-react";
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
import { updatePitch, type SalesPitch } from "@/lib/sales/actions";

export function EditPhotosDialog({
  pitch,
  open,
  onOpenChange,
  onSaved,
}: {
  pitch: SalesPitch;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [hero, setHero] = useState(pitch.hero_image_url ?? "");
  const [gallery, setGallery] = useState<string[]>(
    (pitch.gallery ?? []).map((g) => g.url),
  );
  const [error, setError] = useState<string | null>(null);

  // Re-seed when dialog re-opens with a different pitch.
  useEffect(() => {
    if (open) {
      setHero(pitch.hero_image_url ?? "");
      setGallery((pitch.gallery ?? []).map((g) => g.url));
      setError(null);
    }
  }, [open, pitch.id, pitch.hero_image_url, pitch.gallery]);

  const addRow = () => setGallery((g) => [...g, ""]);
  const updateRow = (i: number, v: string) =>
    setGallery((g) => g.map((u, idx) => (idx === i ? v : u)));
  const removeRow = (i: number) =>
    setGallery((g) => g.filter((_, idx) => idx !== i));

  const handleSave = () => {
    setError(null);
    const cleanedHero = hero.trim();
    const cleanedGallery = gallery
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    startTransition(async () => {
      const r = await updatePitch(pitch.id, {
        hero_image_url: cleanedHero || undefined,
        gallery: cleanedGallery.map((url) => ({ url })),
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast.success("Photos updated");
      onSaved?.();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-haven-coral-600" />
            Edit photos
          </DialogTitle>
          <DialogDescription>
            Update the hero photo and gallery for {pitch.owner_name}'s pitch.
            Leave hero blank to use a curated Smoky Mountain default.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hero photo URL
              <span className="ml-1 text-muted-foreground/70 normal-case font-normal">
                (optional)
              </span>
            </span>
            <Input
              value={hero}
              onChange={(e) => setHero(e.target.value)}
              placeholder="https://…/main-photo.jpg"
              disabled={pending}
            />
            {hero && /^https?:\/\//i.test(hero) ? (
              <img
                src={hero}
                alt="Hero preview"
                className="mt-1 h-32 w-full rounded-md border border-border object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility =
                    "hidden";
                }}
              />
            ) : null}
          </label>

          <div className="rounded-card border border-border bg-surface-alt/30 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Gallery photos
                <span className="ml-1 text-muted-foreground/70 normal-case font-normal">
                  (up to 6)
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addRow}
                disabled={pending || gallery.length >= 6}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {gallery.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                No gallery photos yet. Add 2–4 to give the pitch a richer feel.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {gallery.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-[11px] font-semibold text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Input
                      value={u}
                      onChange={(e) => updateRow(i, e.target.value)}
                      placeholder="https://…/photo.jpg"
                      disabled={pending}
                    />
                    {u && /^https?:\/\//i.test(u) ? (
                      <img
                        src={u}
                        alt={`Gallery preview ${i + 1}`}
                        className="h-9 w-12 shrink-0 rounded-sm border border-border object-cover"
                        onError={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).style.visibility = "hidden";
                        }}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={pending}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save photos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
