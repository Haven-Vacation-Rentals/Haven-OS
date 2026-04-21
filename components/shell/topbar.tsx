"use client";

import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { HavenUser } from "@/lib/auth/user";

export function Topbar({
  user,
  onOpenMobileNav,
}: {
  user: HavenUser;
  /** Open the sidebar drawer on mobile (<lg). Injected by AppShell. */
  onOpenMobileNav?: () => void;
}) {
  function openCommandPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:h-[68px] sm:gap-3 sm:px-6">
      {/* Hamburger — only shown on <lg */}
      {onOpenMobileNav ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      ) : null}

      {/* Brand — shown on mobile since the sidebar header is hidden */}
      <div className="flex items-center lg:hidden">
        <HavenWordmark subtitle={user.name.split(" ")[0]} />
      </div>

      {/* Search — full button on sm+, icon-only on mobile */}
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        className="hidden h-9 w-[340px] items-center gap-2.5 rounded-md border border-border bg-surface-alt px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tasks, docs, people…</span>
        <span className="haven-kbd">⌘K</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={openCommandPalette}
        className="md:hidden"
      >
        <Search className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Help"
          className="hidden sm:inline-flex"
        >
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
        <div className="hidden sm:inline-flex">
          <ThemeToggle />
        </div>
        <div className="mx-1 h-6 w-px bg-border sm:mx-2" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
