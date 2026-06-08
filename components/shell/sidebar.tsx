"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Home,
  Settings,
  Sparkles,
  Target,
  ShieldAlert,
  ClipboardList,
  ClipboardCheck,
  Bot,
  Megaphone,
  PenSquare,
  Magnet,
  PackageSearch,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { Badge } from "@/components/ui/badge";
import { HavenAssistant } from "@/components/shell/haven-assistant";
import type { HavenUser } from "@/lib/auth/user";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  soon?: boolean;
};

type NavSection = { heading: string; items: NavItem[] };

function buildSections(flags: {
  canScorecard: boolean;
  canAgents: boolean;
  canHr: boolean;
  canSales: boolean;
}): NavSection[] {
  const overviewItems: NavItem[] = [
    { label: "The Board", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/my-tasks", icon: ListTodo },
  ];

  const operationsItems: NavItem[] = [
    { label: "Project Management", href: "/work", icon: FolderKanban },
    { label: "Properties", href: "/properties", icon: Home },
    { label: "Onboarding", href: "/onboarding", icon: ClipboardList },
    {
      label: "Clean Transition",
      href: "/operations/clean-transition",
      icon: ClipboardCheck,
    },
    {
      label: "Lost Items",
      href: "/operations/lost-items",
      icon: PackageSearch,
    },
  ];

  const adminItems: NavItem[] = [];
  if (flags.canScorecard) {
    adminItems.push({
      label: "Northstar Scorecard",
      href: "/scorecard",
      icon: Target,
    });
  }
  if (flags.canAgents) {
    adminItems.push({
      label: "Agents",
      href: "/agents",
      icon: Bot,
      badge: "Beta",
    });
  }
  if (flags.canHr) {
    adminItems.push({ label: "HR", href: "/hr", icon: ShieldAlert });
  }
  adminItems.push({ label: "Settings", href: "/settings", icon: Settings });

  const sections: NavSection[] = [
    {
      heading: "Overview",
      items: overviewItems,
    },
    {
      heading: "Operations",
      items: operationsItems,
    },
  ];

  if (flags.canSales) {
    sections.push({
      heading: "GTM",
      items: [
        { label: "Pitches", href: "/sales/pitches", icon: Megaphone },
        { label: "Lead Magnets", href: "/gtm/lead-magnets", icon: Magnet },
        { label: "Content Studio", href: "/content", icon: PenSquare },
      ],
    });
  }

  sections.push({
    heading: "Admin",
    items: adminItems,
  });

  return sections;
}

export function Sidebar({
  user,
  canScorecard = false,
  canAgents = false,
  canHr = false,
  canSales = false,
}: {
  user: HavenUser;
  canScorecard?: boolean;
  canAgents?: boolean;
  canHr?: boolean;
  canSales?: boolean;
}) {
  const sections = buildSections({ canScorecard, canAgents, canHr, canSales });
  const pathname = usePathname();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ⌘J / Ctrl+J global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAssistantOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Listen for topbar's hamburger to open us on mobile
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("haven:open-sidebar", handler);
    return () => window.removeEventListener("haven:open-sidebar", handler);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* Brand header */}
      <div className="flex h-[68px] items-center justify-between border-b border-border px-4">
        <HavenWordmark subtitle={user.name.split(" ")[0]} />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="md:hidden -mr-2 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-alt"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.heading} className="mb-4">
            <div className="haven-eyebrow px-3 pb-1.5">{section.heading}</div>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));
                const rowClass = cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 md:py-1.5",
                  "text-[14px] md:text-[13.5px] font-medium text-foreground/80",
                  "transition-colors",
                  "hover:bg-surface hover:text-foreground",
                  active &&
                    "bg-accent-soft shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.3)] text-haven-coral-700 dark:text-haven-coral",
                  item.soon &&
                    "cursor-not-allowed text-muted-foreground/70 hover:bg-transparent hover:text-muted-foreground/70",
                );
                const inner = (
                  <>
                    <item.icon className="h-[15px] w-[15px] shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <Badge tone="coral" className="h-4 px-1.5 text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                    {item.soon ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Soon
                      </span>
                    ) : null}
                  </>
                );
                return (
                  <li key={item.href}>
                    {item.soon ? (
                      <span aria-disabled="true" className={rowClass}>
                        {inner}
                      </span>
                    ) : (
                      <Link href={item.href as never} className={rowClass}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Assistant button */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => {
            setAssistantOpen(true);
            setMobileOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2",
            "bg-foreground text-background",
            "text-[13px] font-semibold",
            "transition-transform hover:-translate-y-px",
          )}
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="flex-1 text-left">Haven Assistant</span>
          <span className="haven-kbd !bg-foreground/40 !text-background/80 !border-transparent hidden md:inline-flex">
            ⌘J
          </span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — sticky */}
      <aside
        className={cn(
          "hidden md:sticky md:top-0 md:flex h-dvh w-60 shrink-0 flex-col border-r border-border",
          "bg-surface-alt/40 backdrop-blur-sm",
        )}
      >
        {navContent}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 flex h-dvh w-[82vw] max-w-[300px] flex-col border-r border-border bg-surface shadow-2xl",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        {navContent}
      </aside>

      <HavenAssistant
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </>
  );
}
