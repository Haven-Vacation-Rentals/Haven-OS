"use client";

/**
 * AppShell — client wrapper that owns the mobile-nav open state and
 * composes the Sidebar + Topbar + Main content region.
 *
 * Behavior:
 * - `lg` (≥1024px): Sidebar is static on the left, always visible.
 * - `<lg`: Sidebar is hidden by default; tapping the hamburger in the
 *   topbar slides it in from the left with a dimming backdrop.
 *   Tapping the backdrop or navigating closes it.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import type { HavenUser } from "@/lib/auth/user";

export function AppShell({
  user,
  children,
}: {
  user: HavenUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever the route changes (tap a nav item → dismiss)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  // Lock body scroll while drawer is open (mobile only)
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-dvh">
      {/* ── Sidebar (desktop, always visible) ──────────────────────── */}
      <div className="hidden lg:flex">
        <Sidebar user={user} />
      </div>

      {/* ── Mobile nav drawer + backdrop ───────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileNavOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileNavOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden",
          "transform transition-transform duration-200 ease-out",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar user={user} />
      </div>

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
