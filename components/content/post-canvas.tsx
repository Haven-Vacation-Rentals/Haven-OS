"use client";

/**
 * Haven OS — Post canvas.
 *
 * The right-hand pane of the article workspace. Renders the article
 * as an actual blog post (real H1/H2/H3, paragraphs, lists, callouts)
 * and lets Jack edit each block inline. The block list round-trips to
 * markdown via lib/content/markdown so the storage layer (body_md)
 * doesn't change.
 *
 * Design choices:
 *   - One contentEditable element per block, not a single big editor.
 *     Keeps semantic boundaries crisp and avoids fighting the browser
 *     over heading vs paragraph state.
 *   - Block toolbar appears on hover/focus with the few moves Jack
 *     actually uses: change heading level, turn into callout, delete.
 *   - Insert affordance between blocks: + button reveals block type
 *     options (H2, H3, paragraph, list, callout).
 *   - Save is explicit. Dirty state shows in the header. Auto-resync
 *     when `article` changes (e.g. agent applied a suggestion).
 *   - Source toggle reveals the raw markdown for power users / debug.
 *     This is intentionally tucked away and never the default.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Code2,
  Eye,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  MessageSquareQuote,
  Plus,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateArticle } from "@/lib/content/actions";
import {
  parsePostBlocks,
  renderInlineMarkdown,
  serializePostBlocks,
  type PostBlock,
} from "@/lib/content/markdown";
import type { ContentArticle } from "@/lib/content/types";
import { countWords } from "@/lib/content/util";

type Mode = "post" | "source";

let _newBlockSeq = 0;
function newBlockId(): string {
  _newBlockSeq += 1;
  return `nb_${Date.now().toString(36)}_${_newBlockSeq.toString(36)}`;
}

function emptyBlock(type: PostBlock["type"]): PostBlock {
  if (type === "ul" || type === "ol") {
    return { id: newBlockId(), type, items: [""] };
  }
  return { id: newBlockId(), type, text: "" };
}

export function PostCanvas({
  article,
  onLocalChange,
}: {
  article: ContentArticle;
  /**
   * Optional hook for the parent (e.g. agent chat) to be told that
   * the local body has changed. Lets the workspace surface a "draft
   * has unsaved edits" hint. Optional — purely informational.
   */
  onLocalChange?: (markdown: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("post");
  const [blocks, setBlocks] = useState<PostBlock[]>(() =>
    parsePostBlocks(article.body_md),
  );
  const [source, setSource] = useState<string>(article.body_md);
  // Track the upstream body separately so a re-sync only fires when it
  // actually changes (e.g. agent suggestion applied).
  const upstreamRef = useRef<string>(article.body_md);

  const currentMarkdown = useMemo(
    () => serializePostBlocks(blocks),
    [blocks],
  );

  const dirty =
    mode === "post"
      ? currentMarkdown.trim() !== article.body_md.trim()
      : source.trim() !== article.body_md.trim();

  // When the upstream article changes (agent applied suggestion, server
  // refresh after Save), re-seed the editor — but only if Jack hasn't
  // dirtied it locally. This avoids stomping on in-progress edits.
  useEffect(() => {
    if (article.body_md === upstreamRef.current) return;
    upstreamRef.current = article.body_md;
    setBlocks(parsePostBlocks(article.body_md));
    setSource(article.body_md);
  }, [article.body_md]);

  useEffect(() => {
    if (mode === "post") onLocalChange?.(currentMarkdown);
    else onLocalChange?.(source);
  }, [currentMarkdown, source, mode, onLocalChange]);

  const wc = useMemo(
    () => countWords(mode === "post" ? currentMarkdown : source),
    [currentMarkdown, source, mode],
  );

  const save = useCallback(() => {
    const next = mode === "post" ? currentMarkdown : source;
    startTransition(async () => {
      const r = await updateArticle(article.id, { body_md: next });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Draft saved");
      upstreamRef.current = next;
      router.refresh();
    });
  }, [article.id, currentMarkdown, mode, router, source]);

  // ---- block ops ----
  const updateBlock = useCallback((id: string, patch: Partial<PostBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as PostBlock) : b)),
    );
  }, []);
  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)));
  }, []);
  const insertAfter = useCallback((id: string, type: PostBlock["type"]) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const block = emptyBlock(type);
      if (idx === -1) return [...prev, block];
      return [...prev.slice(0, idx + 1), block, ...prev.slice(idx + 1)];
    });
  }, []);
  const changeBlockType = useCallback(
    (id: string, type: PostBlock["type"]) => {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          // Carry text/items across compatible types.
          if (type === "ul" || type === "ol") {
            const items =
              "items" in b
                ? b.items
                : (b as Extract<PostBlock, { type: "p" }>).text
                    .split(/\n+/)
                    .filter(Boolean);
            return { id: b.id, type, items: items.length ? items : [""] };
          }
          const text =
            "text" in b
              ? b.text
              : (b as Extract<PostBlock, { type: "ul" | "ol" }>).items.join(" ");
          return { id: b.id, type, text };
        }),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {wc} words
          </span>
          <span>·</span>
          <span>{Math.max(1, Math.round(wc / 220))} min read</span>
          {dirty ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              Unsaved
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              <Check className="h-2.5 w-2.5" />
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <ModeToggle mode={mode} setMode={setMode} />
          <Button
            variant="primary"
            size="sm"
            onClick={save}
            disabled={pending || !dirty}
          >
            <Save className="h-3.5 w-3.5" />
            Save draft
          </Button>
        </div>
      </div>

      {mode === "post" ? (
        <article className="post-canvas rounded-card border border-border bg-surface px-6 py-8 sm:px-10 sm:py-10">
          <PostBody
            blocks={blocks}
            onUpdate={updateBlock}
            onDelete={deleteBlock}
            onInsertAfter={insertAfter}
            onChangeType={changeBlockType}
          />
          <InsertRow
            onInsert={(type) => {
              const last = blocks[blocks.length - 1];
              if (last) insertAfter(last.id, type);
              else setBlocks([emptyBlock(type)]);
            }}
          />
        </article>
      ) : (
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          rows={28}
          spellCheck
          className="min-h-[640px] w-full rounded-card border border-border bg-surface p-5 font-mono text-[13px] leading-6 text-foreground outline-none focus:border-haven-coral/40"
          placeholder="# Section heading"
        />
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border bg-surface-alt/40 p-0.5 text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => setMode("post")}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 transition",
          mode === "post"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Eye className="h-3 w-3" />
        Post
      </button>
      <button
        type="button"
        onClick={() => setMode("source")}
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 transition",
          mode === "source"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Code2 className="h-3 w-3" />
        Source
      </button>
    </div>
  );
}

function PostBody({
  blocks,
  onUpdate,
  onDelete,
  onInsertAfter,
  onChangeType,
}: {
  blocks: PostBlock[];
  onUpdate: (id: string, patch: Partial<PostBlock>) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (id: string, type: PostBlock["type"]) => void;
  onChangeType: (id: string, type: PostBlock["type"]) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {blocks.map((block) => (
        <BlockRow
          key={block.id}
          block={block}
          onUpdate={(patch) => onUpdate(block.id, patch)}
          onDelete={() => onDelete(block.id)}
          onInsertAfter={(type) => onInsertAfter(block.id, type)}
          onChangeType={(type) => onChangeType(block.id, type)}
        />
      ))}
    </div>
  );
}

function BlockRow({
  block,
  onUpdate,
  onDelete,
  onInsertAfter,
  onChangeType,
}: {
  block: PostBlock;
  onUpdate: (patch: Partial<PostBlock>) => void;
  onDelete: () => void;
  onInsertAfter: (type: PostBlock["type"]) => void;
  onChangeType: (type: PostBlock["type"]) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const showActions = hovered || focused;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className="flex items-start gap-1.5">
        <div
          className={cn(
            "flex w-7 shrink-0 flex-col items-center pt-2 transition",
            showActions ? "opacity-100" : "opacity-0",
          )}
        >
          <BlockMenu block={block} onChangeType={onChangeType} onDelete={onDelete} />
        </div>
        <div className="min-w-0 flex-1">
          <BlockEditor block={block} onUpdate={onUpdate} />
        </div>
      </div>
      <InsertGutter onInsert={onInsertAfter} visible={showActions} />
    </div>
  );
}

function BlockMenu({
  block,
  onChangeType,
  onDelete,
}: {
  block: PostBlock;
  onChangeType: (type: PostBlock["type"]) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-surface-alt"
        aria-label="Block options"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
      {open ? (
        <div
          className="absolute left-7 top-0 z-20 flex w-48 flex-col rounded-md border border-border bg-surface p-1 shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuItem
            icon={Heading2}
            label="Heading 2"
            onClick={() => {
              onChangeType("h2");
              setOpen(false);
            }}
            active={block.type === "h2"}
          />
          <MenuItem
            icon={Heading3}
            label="Heading 3"
            onClick={() => {
              onChangeType("h3");
              setOpen(false);
            }}
            active={block.type === "h3"}
          />
          <MenuItem
            icon={Type}
            label="Paragraph"
            onClick={() => {
              onChangeType("p");
              setOpen(false);
            }}
            active={block.type === "p"}
          />
          <MenuItem
            icon={List}
            label="Bulleted list"
            onClick={() => {
              onChangeType("ul");
              setOpen(false);
            }}
            active={block.type === "ul"}
          />
          <MenuItem
            icon={ListOrdered}
            label="Numbered list"
            onClick={() => {
              onChangeType("ol");
              setOpen(false);
            }}
            active={block.type === "ol"}
          />
          <MenuItem
            icon={MessageSquareQuote}
            label="Callout"
            onClick={() => {
              onChangeType("callout");
              setOpen(false);
            }}
            active={block.type === "callout"}
          />
          <div className="my-1 h-px bg-border" />
          <MenuItem
            icon={Trash2}
            label="Delete block"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            tone="danger"
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  active,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] hover:bg-surface-alt",
        active ? "font-bold text-haven-coral" : "text-foreground",
        tone === "danger" ? "text-haven-coral hover:bg-haven-coral/10" : "",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function InsertGutter({
  onInsert,
  visible,
}: {
  onInsert: (type: PostBlock["type"]) => void;
  visible: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "relative ml-7 mt-1 h-2 transition",
        visible || open ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute -top-1 left-0 inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:border-haven-coral/40 hover:text-haven-coral"
      >
        <Plus className="h-2.5 w-2.5" />
        Insert
      </button>
      {open ? (
        <div
          className="absolute left-0 top-5 z-20 flex flex-wrap gap-1 rounded-md border border-border bg-surface p-1 shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
          {(
            [
              ["p", Type, "Paragraph"],
              ["h2", Heading2, "H2"],
              ["h3", Heading3, "H3"],
              ["ul", List, "List"],
              ["ol", ListOrdered, "Numbered"],
              ["callout", MessageSquareQuote, "Callout"],
            ] as const
          ).map(([t, Icon, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onInsert(t);
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-surface-alt"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InsertRow({
  onInsert,
}: {
  onInsert: (type: PostBlock["type"]) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-dashed border-border pt-3 text-[11px] text-muted-foreground">
      <span className="font-semibold text-foreground">Add block:</span>
      {(
        [
          ["p", Type, "Paragraph"],
          ["h2", Heading2, "H2"],
          ["h3", Heading3, "H3"],
          ["ul", List, "List"],
          ["ol", ListOrdered, "Numbered"],
          ["callout", MessageSquareQuote, "Callout"],
        ] as const
      ).map(([t, Icon, label]) => (
        <button
          key={t}
          type="button"
          onClick={() => onInsert(t)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt/40 px-2 py-0.5 font-semibold hover:border-haven-coral/40 hover:text-haven-coral"
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block editors
// ---------------------------------------------------------------------------

function BlockEditor({
  block,
  onUpdate,
}: {
  block: PostBlock;
  onUpdate: (patch: Partial<PostBlock>) => void;
}) {
  if (block.type === "h1") {
    return (
      <Editable
        as="h1"
        value={block.text}
        onChange={(text) => onUpdate({ text } as Partial<PostBlock>)}
        placeholder="Article title"
        className="font-heading text-display-2 font-bold leading-tight text-foreground"
      />
    );
  }
  if (block.type === "h2") {
    return (
      <Editable
        as="h2"
        value={block.text}
        onChange={(text) => onUpdate({ text } as Partial<PostBlock>)}
        placeholder="Section heading"
        className="font-heading text-display-4 font-bold leading-snug text-foreground mt-6 mb-1"
      />
    );
  }
  if (block.type === "h3") {
    return (
      <Editable
        as="h3"
        value={block.text}
        onChange={(text) => onUpdate({ text } as Partial<PostBlock>)}
        placeholder="Subsection heading"
        className="font-heading text-[19px] font-bold leading-snug text-foreground mt-4 mb-1"
      />
    );
  }
  if (block.type === "p") {
    return (
      <Editable
        as="p"
        value={block.text}
        onChange={(text) => onUpdate({ text } as Partial<PostBlock>)}
        placeholder="Write the next line of the script — VO, on-screen text, or scene direction."
        className="text-[15.5px] leading-7 text-foreground"
        multiline
      />
    );
  }
  if (block.type === "callout") {
    return (
      <div className="my-2 rounded-md border-l-4 border-haven-coral bg-accent-soft/40 px-4 py-3">
        <Editable
          as="div"
          value={block.text}
          onChange={(text) => onUpdate({ text } as Partial<PostBlock>)}
          placeholder="Callout — key beat, on-screen text, or note to the editor"
          className="text-[14.5px] italic leading-7 text-foreground"
          multiline
        />
      </div>
    );
  }
  return (
    <ListEditor
      ordered={block.type === "ol"}
      items={block.items}
      onChange={(items) => onUpdate({ items } as Partial<PostBlock>)}
    />
  );
}

function ListEditor({
  ordered,
  items,
  onChange,
}: {
  ordered: boolean;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  function update(i: number, value: string) {
    const next = items.slice();
    next[i] = value;
    onChange(next);
  }
  function add() {
    onChange([...items, ""]);
  }
  function remove(i: number) {
    if (items.length <= 1) return;
    const next = items.slice();
    next.splice(i, 1);
    onChange(next);
  }

  const ListTag = (ordered ? "ol" : "ul") as "ol" | "ul";
  return (
    <ListTag
      className={cn(
        "ml-5 flex flex-col gap-1 text-[15px] leading-7 text-foreground",
        ordered ? "list-decimal" : "list-disc",
      )}
    >
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          <div className="flex items-start gap-1">
            <Editable
              as="div"
              value={item}
              onChange={(v) => update(i, v)}
              placeholder="List item"
              className="min-w-0 flex-1"
              multiline={false}
              onEnter={() => add()}
              onBackspaceEmpty={() => remove(i)}
            />
          </div>
        </li>
      ))}
    </ListTag>
  );
}

// ---------------------------------------------------------------------------
// Editable — a thin contentEditable wrapper that preserves caret on
// re-render and emits plain text on input. Block elements stay
// semantic (real <h1>/<h2>/<p>) so the post looks like a post.
// ---------------------------------------------------------------------------

/**
 * Inline markdown is preserved on disk (`body_md`). The post view should
 * look like the published post — `[Rabbu](https://rabbu.com)` should
 * render as a real anchor, not as raw markdown. We accomplish that with
 * two display modes per block:
 *
 *   - editing  → contentEditable shows the raw markdown source so Jack
 *                can type/paste/edit links as `[anchor](url)` directly.
 *   - rendered → contentEditable is replaced with a read-only element
 *                whose innerHTML is the safe HTML produced by
 *                renderInlineMarkdown (real <a>, <strong>, <em>).
 *
 * Clicking the rendered view flips it into edit mode and refocuses,
 * so the affordance still feels like a single editable block.
 */
function hasInlineMarkdown(text: string): boolean {
  return /\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|(?:^|[^*])\*[^*]+\*/.test(
    text ?? "",
  );
}

function Editable({
  as,
  value,
  onChange,
  placeholder,
  className,
  multiline,
  onEnter,
  onBackspaceEmpty,
}: {
  as: "h1" | "h2" | "h3" | "p" | "div";
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);

  // Sync from prop only when the DOM text has actually drifted from
  // the prop. This keeps the caret stable while typing in edit mode.
  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value, editing]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent ?? "";
    onChange(text);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      if (multiline && e.shiftKey) return;
      e.preventDefault();
      onEnter?.();
      return;
    }
    if (
      e.key === "Backspace" &&
      (e.currentTarget.textContent ?? "").length === 0
    ) {
      e.preventDefault();
      onBackspaceEmpty?.();
    }
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
    if (node && editing && document.activeElement !== node) {
      // After flipping into edit mode, make sure caret lands at end.
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      node.focus();
    }
  };

  const renderedClass = cn(
    "rounded-md cursor-text hover:bg-haven-coral/[0.03] hover:px-1 hover:-mx-1 transition",
    "empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)]",
    className,
  );
  const editingClass = cn(
    "outline-none focus:bg-haven-coral/[0.03] focus:rounded-md focus:px-1 focus:-mx-1",
    "empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)]",
    className,
  );

  // ---- Rendered (read-only) view --------------------------------------
  // Show real <a>/<strong>/<em> when the block contains inline markdown.
  // Click flips into edit mode.
  if (!editing) {
    const html = value ? renderInlineMarkdown(value) : "";
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      // Inline anchors inside a rendered block would navigate away;
      // clicking should instead flip into edit mode so Jack can change
      // the link. He can preview/follow links from the Source tab or
      // after publish.
      const target = e.target as HTMLElement;
      if (target.tagName === "A") e.preventDefault();
      setEditing(true);
    };
    const renderedProps = {
      "data-placeholder": placeholder,
      className: renderedClass,
      onClick: handleClick,
      onFocus: () => setEditing(true),
      tabIndex: 0,
      // dangerouslySetInnerHTML is safe here — renderInlineMarkdown
      // escapes everything before layering whitelisted patterns.
      dangerouslySetInnerHTML: { __html: html },
    } as const;
    if (as === "h1") return <h1 {...renderedProps} />;
    if (as === "h2") return <h2 {...renderedProps} />;
    if (as === "h3") return <h3 {...renderedProps} />;
    if (as === "p") return <p {...renderedProps} />;
    return <div {...renderedProps} />;
  }

  // ---- Edit mode ------------------------------------------------------
  // Plain text contentEditable showing markdown source. On blur, flip
  // back to rendered view. Note: clicking a rendered <a> link inside a
  // block would normally navigate; in edit mode we let the user place
  // the cursor anywhere in the markdown.
  const editableProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true as const,
    "data-placeholder": placeholder,
    className: editingClass,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onPaste: handlePaste,
    onBlur: () => setEditing(false),
  };

  if (as === "h1") {
    return <h1 ref={setRef as React.Ref<HTMLHeadingElement>} {...editableProps} />;
  }
  if (as === "h2") {
    return <h2 ref={setRef as React.Ref<HTMLHeadingElement>} {...editableProps} />;
  }
  if (as === "h3") {
    return <h3 ref={setRef as React.Ref<HTMLHeadingElement>} {...editableProps} />;
  }
  if (as === "p") {
    return <p ref={setRef as React.Ref<HTMLParagraphElement>} {...editableProps} />;
  }
  return <div ref={setRef as React.Ref<HTMLDivElement>} {...editableProps} />;
}

