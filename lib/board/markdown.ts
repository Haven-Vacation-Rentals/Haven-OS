/**
 * Minimal, safe markdown renderer for announcement bodies.
 *
 * Supports: paragraphs, line breaks, **bold**, *italic*, `code`,
 * [links](https://...), unordered lists (- item), ordered lists (1. item),
 * and headings (## Heading).
 *
 * Escapes HTML first to prevent XSS from the user's raw input.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(s: string): string {
  let out = escapeHtml(s);

  // Links: [text](https://url)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text, url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2 hover:brightness-90">${text}</a>`,
  );

  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic: *text* (not matching ** which is bold)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

  // Code: `text`
  out = out.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[12px]">$1</code>',
  );

  return out;
}

/**
 * Render a markdown-ish body to safe HTML.
 * Output is meant to be passed to dangerouslySetInnerHTML.
 */
export function renderAnnouncementBody(body: string): string {
  const lines = body.split(/\r?\n/);
  const blocks: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      const tag = listType ?? "ul";
      const cls = tag === "ul" ? "list-disc" : "list-decimal";
      blocks.push(
        `<${tag} class="${cls} space-y-1 pl-5">${listItems.join("")}</${tag}>`,
      );
      listItems = [];
      listType = null;
    }
  };

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        `<p class="leading-relaxed">${paragraph.map(renderInline).join("<br />")}</p>`,
      );
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading ## Title
    const heading = line.match(/^(#{2,4})\s+(.+)/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length; // 2..4
      const sizes = { 2: "text-[17px]", 3: "text-[15px]", 4: "text-[13px]" } as const;
      const size = sizes[level as 2 | 3 | 4];
      blocks.push(
        `<h${level} class="font-heading ${size} font-bold">${renderInline(heading[2])}</h${level}>`,
      );
      continue;
    }

    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.+)/);
    if (ul) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(`<li>${renderInline(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.+)/);
    if (ol) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(`<li>${renderInline(ol[1])}</li>`);
      continue;
    }

    // Paragraph line
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("\n");
}
