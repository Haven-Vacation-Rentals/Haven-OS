"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Home,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HavenWordmark } from "@/components/brand/haven-logo";
import { Badge } from "@/components/ui/badge";
import type { HavenUser } from "@/lib/auth/user";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  soon?: boolean;
};

type NavSection = { heading: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Work",
    items: [
      { label: "My Tasks", href: "/my-tasks", icon: ListTodo },
      { label: "Project Management", href: "/work", icon: FolderKanban },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Properties", href: "/properties", icon: Home },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ user }: { user: HavenUser }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        // On lg+ the sidebar is sticky in the page flow.
        // On <lg it's placed inside the AppShell drawer which handles
        // positioning, so `h-dvh w-full` fills that drawer.
        "flex h-dvh w-full shrink-0 flex-col border-r border-border",
        "bg-surface-alt/95 backdrop-blur-sm lg:sticky lg:top-0 lg:w-60 lg:bg-surface-alt/40",
      )}
    >
      {/* Brand header */}
      <div className="flex h-[68px] items-center border-b border-border px-4">
        <HavenWordmark subtitle={user.name.split(" ")[0]} />
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
                  "group flex items-center gap-2.5 rounded-md px-3 py-1.5",
                  "text-[13.5px] font-medium text-foreground/80",
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

      {/* Assistant hint */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2",
            "bg-foreground text-background",
            "text-[13px] font-semibold",
            "transition-transform hover:-translate-y-px",
          )}
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="flex-1 text-left">Haven Assistant</span>
          <span className="haven-kbd !bg-foreground/40 !text-background/80 !border-transparent">
            ⌘J
          </span>
        </button>
      </div>
    </aside>
  );
}
