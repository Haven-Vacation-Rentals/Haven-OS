/**
 * Haven OS — Paid Advertising markdown helpers.
 *
 * Ad scripts are stored as markdown (`body_md`). The script editor
 * renders that markdown as a sequence of semantic blocks (true
 * H1/H2/H3, paragraphs, lists, callouts) so the script reads cleanly,
 * not as a textarea full of markdown. These helpers are the
 * round-trip bridge:
 *
 *   markdown string  ──parsePostBlocks──▶  PostBlock[]
 *   PostBlock[]      ──serializePostBlocks──▶  markdown string
 *
 * Round-trip is intentionally lossy at the edges — it normalizes
 * whitespace, collapses blank lines, and rewrites bullets into a
 * canonical form. Anything we don't recognize falls back to a
 * paragraph block so we never drop content.
 */

export type PostBlock =
  | { id: string; type: "h1"; text: string }
  | { id: string; type: "h2"; text: string }
  | { id: string; type: "h3"; text: string }
  | { id: string; type: "p"; text: string }
  | { id: string; type: "ul"; items: string[] }
  | { id: string; type: "ol"; items: string[] }
  | { id: string; type: "callout"; text: string };

/**
 * IDs are deterministic per parse so SSR and the first client render
 * produce the same React keys — no hydration mismatch.
 */
function makeIdFactory(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `b${n}`;
  };
}

export function parsePostBlocks(md: string): PostBlock[] {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: PostBlock[] = [];
  const nextId = makeIdFactory();

  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  let callout: string[] | null = null;

  function flushPara() {
    if (para.length === 0) return;
    const text = para.join(" ").trim();
    if (text) blocks.push({ id: nextId(), type: "p", text });
    para = [];
  }
  function flushList() {
    if (!list || list.items.length === 0) {
      list = null;
      return;
    }
    blocks.push({ id: nextId(), type: list.kind, items: list.items });
    list = null;
  }
  function flushCallout() {
    if (!callout) return;
    const text = callout.join(" ").trim();
    if (text) blocks.push({ id: nextId(), type: "callout", text });
    callout = null;
  }
  function flushAll() {
    flushPara();
    flushList();
    flushCallout();
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushAll();
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      const lvl = h[1]!.length;
      const text = h[2]!.trim();
      const type: "h1" | "h2" | "h3" =
        lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3";
      blocks.push({ id: nextId(), type, text });
      continue;
    }

    const ul = /^[-*+]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      flushCallout();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(ul[1]!.trim());
      continue;
    }

    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      flushCallout();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ol[1]!.trim());
      continue;
    }

    const bq = /^>\s?(.*)$/.exec(line);
    if (bq) {
      flushPara();
      flushList();
      if (!callout) callout = [];
      callout.push(bq[1]!.trim());
      continue;
    }

    flushList();
    flushCallout();
    para.push(line.trim());
  }

  flushAll();
  return blocks;
}

export function serializePostBlocks(blocks: PostBlock[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "h1") {
      parts.push(`# ${b.text.trim()}`);
    } else if (b.type === "h2") {
      parts.push(`## ${b.text.trim()}`);
    } else if (b.type === "h3") {
      parts.push(`### ${b.text.trim()}`);
    } else if (b.type === "p") {
      parts.push(b.text.trim());
    } else if (b.type === "ul") {
      parts.push(b.items.map((i) => `- ${i.trim()}`).join("\n"));
    } else if (b.type === "ol") {
      parts.push(b.items.map((i, idx) => `${idx + 1}. ${i.trim()}`).join("\n"));
    } else if (b.type === "callout") {
      parts.push(
        b.text
          .trim()
          .split(/\n+/)
          .map((line) => `> ${line.trim()}`)
          .join("\n"),
      );
    }
  }
  return parts.join("\n\n").replace(/\s+$/, "") + "\n";
}

/**
 * Render minimal inline markdown (bold, italic, links) to safe HTML
 * for read-only display. Escapes HTML first, then layers inline
 * patterns. Used by the post canvas for paragraph/list text.
 */
export function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener" class="text-haven-coral underline underline-offset-2 hover:text-haven-coral-700">$1</a>',
    );
}

/**
 * Strip block markdown markers for plain-text contexts (e.g., word
 * counts, agent excerpts). Keeps inline content readable.
 */
export function stripMarkdown(md: string): string {
  return (md ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .trim();
}
