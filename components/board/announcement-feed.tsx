"use client";

import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementEditor } from "./announcement-editor";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/board/types";

export function AnnouncementFeed({
  announcements,
  isAdmin,
}: {
  announcements: Announcement[];
  isAdmin: boolean;
}) {
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[15px] font-bold">Announcements</h2>
        {isAdmin && (
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/40 p-8 text-center">
          <div className="rounded-full bg-surface p-3">
            <Megaphone className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <div className="font-heading text-[15px] font-bold">No announcements yet</div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isAdmin
                ? "Post the first one to share news with the team."
                : "When an admin posts an update, it'll appear here."}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" variant="secondary" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> Post announcement
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {isAdmin && <AnnouncementEditor open={newOpen} onOpenChange={setNewOpen} />}
    </div>
  );
}
