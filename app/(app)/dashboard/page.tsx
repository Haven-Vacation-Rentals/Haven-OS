import { LoomCard } from "@/components/board/loom-card";
import { AnnouncementFeed } from "@/components/board/announcement-feed";
import { getBoardData } from "@/lib/board/actions";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * The Board — team home page. Shows the quarterly Loom and announcements.
 */
export default async function BoardPage() {
  const board = await getBoardData();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-display-2 font-bold tracking-tight">
          The Board
        </h1>
        <p className="text-sm text-muted-foreground">
          Team home · quarterly updates and announcements
        </p>
      </div>

      {/* Loom + announcements — two-column on desktop, stacked on mobile */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <LoomCard loom={board.loom} />
        <AnnouncementFeed
          announcements={board.announcements}
          isAdmin={board.isAdmin}
        />
      </section>
    </div>
  );
}
