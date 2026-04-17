"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export type MentionUser = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

/**
 * Textarea with @mention autocomplete.
 *
 * When the user types `@`, a dropdown of matching users appears. Selecting a
 * user inserts `@[Full Name](userId)` into the text. The parent receives the
 * raw text via `value`/`onChange`.
 */
export function MentionInput({
  value,
  onChange,
  users,
  placeholder,
  className,
  onSubmit,
  rows = 1,
  autoGrow = false,
  maxHeight = 480,
}: {
  value: string;
  onChange: (v: string) => void;
  users: MentionUser[];
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
  rows?: number;
  autoGrow?: boolean;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Track where the @ trigger started in the text
  const triggerPosRef = useRef<number>(-1);

  const filtered = mentionQuery !== null
    ? users.filter((u) => {
        const q = mentionQuery.toLowerCase();
        return (
          (u.full_name?.toLowerCase().includes(q) ?? false) ||
          u.email.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setMentionQuery(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-grow the textarea to fit content when autoGrow is enabled
  useEffect(() => {
    if (!autoGrow) return;
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = `${next}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, autoGrow, maxHeight]);

  const insertMention = useCallback(
    (user: MentionUser) => {
      const ta = ref.current;
      if (!ta) return;

      const before = value.slice(0, triggerPosRef.current);
      const after = value.slice(ta.selectionStart);
      const mention = `@[${user.full_name ?? user.email}](${user.id})`;
      const newValue = before + mention + " " + after;

      onChange(newValue);
      setMentionQuery(null);

      // Restore cursor after mention
      requestAnimationFrame(() => {
        const pos = before.length + mention.length + 1;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
        ta.focus();
      });
    },
    [value, onChange],
  );

  function handleInput() {
    const ta = ref.current;
    if (!ta) return;

    const cursor = ta.selectionStart;
    const textBefore = value.slice(0, cursor);

    // Find the last @ not preceded by a word char
    const match = textBefore.match(/(^|[^a-zA-Z0-9])@([a-zA-Z0-9 ]*)$/);
    if (match) {
      triggerPosRef.current = textBefore.lastIndexOf("@" + match[2]);
      setMentionQuery(match[2]);
      setMentionIdx(0);

      // Position the menu near the textarea
      const rect = ta.getBoundingClientRect();
      setMenuPos({
        top: rect.height + 4,
        left: 0,
      });
    } else {
      setMentionQuery(null);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Submit on Enter (without Shift) when no mention menu is open
    if (e.key === "Enter" && !e.shiftKey && mentionQuery === null && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // handleInput needs to run after state update
          requestAnimationFrame(() => handleInput());
        }}
        onKeyDown={handleKeyDown}
        onSelect={handleInput}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] outline-none focus:shadow-ring placeholder:text-muted-foreground/60",
          className,
        )}
      />

      {/* Mention dropdown */}
      {mentionQuery !== null && filtered.length > 0 ? (
        <div
          ref={menuRef}
          className="absolute z-50 w-56 animate-slide-up rounded-card border border-border bg-surface py-1 shadow-card-hover"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {filtered.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent textarea blur
                insertMention(u);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px]",
                i === mentionIdx
                  ? "bg-accent-soft text-accent"
                  : "hover:bg-surface-alt",
              )}
            >
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.avatar_url}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold">
                  {(u.full_name ?? u.email)?.[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {u.full_name ?? u.email}
                </div>
                {u.full_name ? (
                  <div className="truncate text-[11px] text-muted-foreground">
                    {u.email}
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Renders text with @mentions highlighted as styled chips.
 *
 * Mention format: `@[Display Name](userId)`
 */
export function MentionText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Parse @[Name](id) patterns
  const parts: { type: "text" | "mention"; value: string; id?: string }[] = [];
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mention", value: match[1], id: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === "mention" ? (
          <span
            key={i}
            className="inline-flex items-center rounded bg-accent-soft px-1 py-px text-[12px] font-semibold text-accent"
            title={part.id}
          >
            @{part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </span>
  );
}
