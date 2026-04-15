"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  ListTodo,
  Home,
  Users,
  FileText,
  Sparkles,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandEntry = {
  id: string;
  label: string;
  hint?: string;
  group: "Navigate" | "Create" | "Assistant";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  const go = (href: string) => () => {
    router.push(href as never);
    setOpen(false);
  };

  const entries: CommandEntry[] = [
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      group: "Navigate",
      icon: LayoutDashboard,
      action: go("/dashboard"),
    },
    {
      id: "nav-inbox",
      label: "Open Inbox",
      group: "Navigate",
      icon: Inbox,
      action: go("/inbox"),
    },
    {
      id: "nav-work",
      label: "Go to Work",
      group: "Navigate",
      icon: ListTodo,
      action: go("/work"),
    },
    {
      id: "nav-properties",
      label: "Properties",
      group: "Navigate",
      icon: Home,
      action: go("/properties"),
    },
    {
      id: "nav-people",
      label: "People",
      group: "Navigate",
      icon: Users,
      action: go("/people"),
    },
    {
      id: "create-task",
      label: "New task",
      hint: "Q",
      group: "Create",
      icon: ListTodo,
      action: () => setOpen(false),
    },
    {
      id: "create-doc",
      label: "New doc",
      group: "Create",
      icon: FileText,
      action: () => setOpen(false),
    },
    {
      id: "ai-ask",
      label: "Ask Haven Assistant…",
      hint: "⌘J",
      group: "Assistant",
      icon: Sparkles,
      action: () => setOpen(false),
    },
  ];

  const groups = ["Navigate", "Create", "Assistant"] as const;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 animate-fade-in bg-foreground/20 backdrop-blur-sm" />
      <div
        className={cn(
          "relative w-full max-w-xl animate-slide-up overflow-hidden",
          "rounded-card border border-border bg-surface shadow-card-hover",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Haven Command Palette">
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search or jump to…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <span className="haven-kbd">ESC</span>
          </div>
          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              Nothing matches.
            </Command.Empty>
            {groups.map((g) => (
              <Command.Group
                key={g}
                heading={g}
                className="[&_[cmdk-group-heading]]:haven-eyebrow [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3"
              >
                {entries
                  .filter((e) => e.group === g)
                  .map((e) => (
                    <Command.Item
                      key={e.id}
                      value={e.label}
                      onSelect={e.action}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
                        "data-[selected=true]:bg-surface-alt",
                      )}
                    >
                      <e.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{e.label}</span>
                      {e.hint ? <span className="haven-kbd">{e.hint}</span> : null}
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
