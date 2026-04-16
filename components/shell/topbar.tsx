"use client";

import { Bell, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { HavenUser } from "@/lib/auth/user";

export function Topbar({ user }: { user: HavenUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
      {/* Search button — opens the command palette */}
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true }),
          )
        }
        className="flex h-9 w-[340px] items-center gap-2.5 rounded-md border border-border bg-surface-alt px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tasks, docs, people…</span>
        <span className="haven-kbd">⌘K</span>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <div className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              4
            </span>
          </div>
        </Button>
        <ThemeToggle />
        <div className="mx-2 h-6 w-px bg-border" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
