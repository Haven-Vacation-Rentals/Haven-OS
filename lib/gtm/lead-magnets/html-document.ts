/**
 * Helpers for the `html_document` lead magnet content shape.
 *
 * Kept in a separate, non-server module so client components (editors,
 * lists) can import without dragging in the "use server" surface from
 * actions.ts.
 */

export type LeadMagnetHtmlDocument = {
  kind: "html_document";
  html: string;
};

/**
 * Detect whether a lead magnet's content payload should be rendered as a
 * full-page HTML document. Returns the parsed shape or null. Accepts:
 *   - `{ kind: "html_document", html: "..." }`
 *   - `[{ kind: "html_document", html: "..." }]`
 */
export function getHtmlDocument(
  content: unknown,
): LeadMagnetHtmlDocument | null {
  if (!content) return null;
  const candidate = Array.isArray(content)
    ? content.length === 1
      ? content[0]
      : null
    : (content as Record<string, unknown>);
  if (
    candidate &&
    typeof candidate === "object" &&
    (candidate as Record<string, unknown>).kind === "html_document" &&
    typeof (candidate as Record<string, unknown>).html === "string"
  ) {
    return {
      kind: "html_document",
      html: (candidate as Record<string, unknown>).html as string,
    };
  }
  return null;
}
