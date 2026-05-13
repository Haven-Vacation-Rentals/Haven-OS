"use client";

import { HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import type { HavenUser } from "@/lib/auth/user";

export function Topbar({
  user,
  initialUnread = 0,
}: {
  user: HavenUser;
  initialUnread?: number;
}) {
  const openPalette = () =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );

  return (
    <header className="sticky top-0 z-30 flex h-[60px] md:h-[68px] items-center gap-2 md:gap-3 border-b border-border bg-background/80 px-3 md:px-6 backdrop-blur">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("haven:open-sidebar"))}
        aria-label="Open menu"
        className="md:hidden -ml-1 grid h-10 w-10 place-items-center rounded-md text-foreground hover:bg-surface-alt"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search — full width input on desktop, icon-only on mobile */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search"
        className="hidden md:flex h-9 w-[340px] items-center gap-2.5 rounded-md border border-border bg-surface-alt px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tasks, docs, people…</span>
        <span className="haven-kbd">⌘K</span>
      </button>
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search"
        className="md:hidden grid h-10 w-10 place-items-center rounded-md text-foreground hover:bg-surface-alt"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-0.5 md:gap-1">
        <Button variant="ghost" size="icon" aria-label="Help" className="hidden md:inline-flex">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <NotificationBell initialUnread={initialUnread} />
        <ThemeToggle />
        <div className="mx-1 md:mx-2 hidden md:block h-6 w-px bg-border" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
