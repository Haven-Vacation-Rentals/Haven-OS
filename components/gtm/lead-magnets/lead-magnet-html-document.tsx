/**
 * LeadMagnetHtmlDocument — public renderer for `html_document` content.
 *
 * Renders an uploaded standalone HTML document inside a sandboxed iframe
 * via `srcDoc`. The iframe is isolated from the OS app shell so the
 * document's CSS, fonts, and inline JS can't leak into Haven OS pages
 * (and vice-versa).
 *
 * Sandbox flags:
 *   - `allow-scripts`     — let the document run its own JS (animations,
 *                           interactivity).
 *   - `allow-popups`      — `<a target="_blank">` links work.
 *   - `allow-popups-to-escape-sandbox` — opened tabs aren't sandboxed.
 *   - `allow-forms`       — embedded forms can submit to their action URLs.
 *   - We deliberately omit `allow-same-origin` so the iframe gets a unique
 *     opaque origin and cannot read cookies/storage from the parent.
 */
export function LeadMagnetHtmlDocument({ html }: { html: string }) {
  return (
    <div className="fixed inset-0 h-dvh w-dvw bg-white">
      <iframe
        title="Lead magnet document"
        srcDoc={html}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        referrerPolicy="no-referrer"
        className="h-full w-full border-0"
      />
    </div>
  );
}
