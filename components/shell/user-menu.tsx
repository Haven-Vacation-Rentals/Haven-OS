"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { HavenUser } from "@/lib/auth/user";

export function UserMenu({ user }: { user: HavenUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-alt sm:px-2"
      >
        <Avatar user={user} />
        <span className="hidden text-[13px] font-semibold sm:inline">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:inline" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-40 mt-1.5 w-60 animate-slide-up overflow-hidden",
            "rounded-card border border-border bg-surface shadow-card-hover",
          )}
        >
          <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
            <Avatar user={user} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold">
                {user.name}
              </div>
              <div className="truncate text-[12px] text-muted-foreground">
                {user.email}
              </div>
            </div>
          </div>
          <div className="py-1">
            <MenuItem icon={UserIcon} label="Profile" disabled />
            <MenuItem icon={Settings} label="Settings" disabled />
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-[13px] font-semibold text-foreground/80 hover:bg-surface-alt"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ user, size = 28 }: { user: HavenUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        className="rounded-full"
      />
    );
  }
  return (
    <span
      className="grid place-items-center rounded-full bg-foreground font-bold text-background"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.5) }}
    >
      {user.initials}
    </span>
  );
}

function MenuItem({
  icon: Icon,
  label,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium",
        "hover:bg-surface-alt",
        disabled && "cursor-not-allowed text-muted-foreground/70 hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {disabled ? (
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Soon
        </span>
      ) : null}
    </button>
  );
}
