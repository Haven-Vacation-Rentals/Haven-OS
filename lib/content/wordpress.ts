/**
 * Haven OS — WordPress draft wrapper.
 *
 * Creates DRAFT posts only. Never publishes directly. Only fires when:
 *   - HAVEN_WP_URL, HAVEN_WP_USER, HAVEN_WP_APP_PASSWORD are all set
 *   - The caller explicitly invokes the publish job action
 *
 * If credentials are missing or the host is unreachable the calling
 * action records the publish job with status `credentials_missing` or
 * `blocked` and the article stays intact in Haven OS — no draft is lost.
 */

export type WpDraftPayload = {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
};

export type WpDraftResult =
  | {
      ok: true;
      post_id: string;
      draft_url: string;
    }
  | {
      ok: false;
      reason: "credentials_missing" | "request_failed";
      error: string;
    };

export type WpEnv = {
  url: string;
  user: string;
  appPassword: string;
};

export function readWpEnv(): WpEnv | null {
  const url = process.env.HAVEN_WP_URL?.trim();
  const user = process.env.HAVEN_WP_USER?.trim();
  const appPassword = process.env.HAVEN_WP_APP_PASSWORD?.trim();
  if (!url || !user || !appPassword) return null;
  return { url, user, appPassword };
}

/**
 * Post the article body to WordPress as a draft. Always sets status to
 * "draft". Returns a structured result instead of throwing.
 *
 * NOTE: this function is the only place that touches WordPress. Tests
 * and builds must never call it. Server actions only call it inside an
 * explicit publish job, behind an admin-only gate.
 */
export async function createWordPressDraft(
  payload: WpDraftPayload,
): Promise<WpDraftResult> {
  const env = readWpEnv();
  if (!env) {
    return {
      ok: false,
      reason: "credentials_missing",
      error:
        "WordPress credentials missing — set HAVEN_WP_URL, HAVEN_WP_USER, and HAVEN_WP_APP_PASSWORD.",
    };
  }

  const auth = Buffer.from(`${env.user}:${env.appPassword}`).toString("base64");
  const endpoint = `${env.url.replace(/\/$/, "")}/wp-json/wp/v2/posts`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        status: "draft",
        title: payload.title,
        content: payload.content,
        excerpt: payload.excerpt ?? "",
        slug: payload.slug,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "request_failed",
        error: `WordPress responded ${res.status}: ${text.slice(0, 400)}`,
      };
    }

    const json = (await res.json()) as { id?: number; link?: string };
    if (!json.id) {
      return {
        ok: false,
        reason: "request_failed",
        error: "WordPress response missing post id",
      };
    }

    return {
      ok: true,
      post_id: String(json.id),
      draft_url:
        json.link ?? `${env.url.replace(/\/$/, "")}/?p=${json.id}&preview=true`,
    };
  } catch (err) {
    return {
      ok: false,
      reason: "request_failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tiny markdown → HTML converter for the draft body. Intentionally
 * minimal: WordPress has its own block editor, so we keep formatting
 * simple and let Jack polish in WP if he wants. No dependency.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    if (text) out.push(`<p>${inline(text)}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!inList) return;
    out.push(`</${inList}>`);
    inList = null;
  }

  function inline(t: string): string {
    return t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" rel="noopener">$1</a>',
      );
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph();
      closeList();
      const lvl = h[1]!.length;
      out.push(`<h${lvl}>${inline(h[2]!)}</h${lvl}>`);
      continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushParagraph();
      if (inList !== "ul") {
        closeList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ul[1]!)}</li>`);
      continue;
    }

    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      flushParagraph();
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(ol[1]!)}</li>`);
      continue;
    }

    closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return out.join("\n");
}
