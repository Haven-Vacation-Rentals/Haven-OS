import { Video } from "lucide-react";
import type { LoomEmbed } from "@/lib/board/types";

export function LoomCard({ loom }: { loom: LoomEmbed | null }) {
  if (!loom) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/40 p-8 text-center">
        <div className="rounded-full bg-surface p-3">
          <Video className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <div className="font-heading text-[15px] font-bold">No quarterly update yet</div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Admins can paste a Loom link in Settings → The Board.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-[15px] font-bold">
          {loom.title ?? "Quarterly update"}
        </h2>
        <a
          href={loom.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-muted-foreground hover:text-foreground"
        >
          Open in Loom ↗
        </a>
      </div>
      <div className="relative w-full overflow-hidden rounded-card border border-border bg-black shadow-card" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={loom.embedUrl}
          className="absolute inset-0 h-full w-full"
          allow="fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          title={loom.title ?? "Quarterly update"}
        />
      </div>
    </div>
  );
}
