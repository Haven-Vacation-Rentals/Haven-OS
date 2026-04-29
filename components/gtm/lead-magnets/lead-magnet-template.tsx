/**
 * LeadMagnetTemplate — public landing page rendered at /lead-magnet/<slug>.
 *
 * Theme matches havenvacationrentals.com (coral + charcoal + sage). All
 * colors are inline literals so the page is stable even if the OS Tailwind
 * theme drifts. Sections are rendered from the magnet's flexible `content`
 * jsonb, with permissive fallbacks for unknown shapes.
 */

import type { LeadMagnet } from "@/lib/gtm/lead-magnets/actions";
import { LeadMagnetCaptureForm } from "@/components/gtm/lead-magnets/lead-magnet-capture-form";

const HAVEN_LOGO =
  "https://havenvacationrentals.com/wp-content/uploads/2023/07/Haven-Logo-Black-Transparent-4.png";

const HAVEN_HERO_FALLBACKS = [
  "https://havenvacationrentals.com/wp-content/uploads/2020/03/cabin.jpg",
  "https://havenvacationrentals.com/wp-content/uploads/2020/03/1.jpg",
  "https://havenvacationrentals.com/wp-content/uploads/2020/03/2.jpg",
  "https://havenvacationrentals.com/wp-content/uploads/2020/03/3.jpg",
  "https://havenvacationrentals.com/wp-content/uploads/2020/03/4.jpg",
  "https://havenvacationrentals.com/wp-content/uploads/2020/05/IMG_2853.jpg",
] as const;

function pickFallbackHero(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return HAVEN_HERO_FALLBACKS[h % HAVEN_HERO_FALLBACKS.length];
}

export function LeadMagnetTemplate({ magnet }: { magnet: LeadMagnet }) {
  const heroImage = magnet.hero_image_url || pickFallbackHero(magnet.slug);
  const sections = Array.isArray(magnet.content) ? magnet.content : [];

  return (
    <main className="min-h-dvh bg-[#FAF8F3] text-haven-charcoal">
      {/* Top bar */}
      <header className="border-b border-haven-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="https://havenvacationrentals.com" target="_blank" rel="noreferrer">
            <img src={HAVEN_LOGO} alt="Haven Vacation Rentals" className="h-9 w-auto" />
          </a>
          <a
            href="https://havenvacationrentals.com/contact-us/"
            target="_blank"
            rel="noreferrer"
            className="hidden text-[12px] font-black uppercase tracking-[2px] text-haven-charcoal hover:text-[#FF564E] sm:block"
          >
            Visit Haven
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative isolate overflow-hidden"
        style={{
          background: `linear-gradient(rgba(20,20,20,0.55), rgba(20,20,20,0.55)), url(${heroImage}) center/cover no-repeat`,
        }}
      >
        <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-start justify-end gap-3 px-6 py-16 text-white">
          {magnet.eyebrow ? (
            <div className="haven-eyebrow text-white/90 tracking-[2px]">
              {magnet.eyebrow}
            </div>
          ) : null}
          <h1 className="font-heading text-[40px] font-bold leading-[1.05] uppercase sm:text-[56px]">
            {magnet.title}
          </h1>
          {magnet.subtitle ? (
            <p className="max-w-2xl text-[16px] leading-relaxed text-white/90">
              {magnet.subtitle}
            </p>
          ) : null}
        </div>
      </section>

      {/* Body — content sections + capture form (sticky on desktop) */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {sections.length === 0 ? (
            <DefaultBody title={magnet.title} />
          ) : (
            sections.map((s, i) => (
              <SectionRenderer key={i} section={s} />
            ))
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-haven-charcoal/10 bg-white p-6 shadow-sm">
            {magnet.cta?.type === "link" && magnet.cta.href ? (
              <div className="flex flex-col gap-3 text-center">
                <h3 className="font-heading text-[18px] font-bold uppercase tracking-[1.5px] text-haven-charcoal">
                  Ready when you are
                </h3>
                <a
                  href={magnet.cta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[30px] bg-[#FF564E] px-6 py-3 text-[13px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95"
                >
                  {magnet.cta.label || "Continue"}
                </a>
              </div>
            ) : (
              <LeadMagnetCaptureForm magnet={magnet} />
            )}
          </div>
        </aside>
      </section>

      {/* Footer */}
      <footer className="border-t border-haven-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center">
          <img src={HAVEN_LOGO} alt="Haven Vacation Rentals" className="h-7 w-auto" />
          <p className="text-[12px] text-haven-charcoal/60">
            © {new Date().getFullYear()} Haven Vacation Rentals · Pigeon Forge · Gatlinburg · Sevierville
          </p>
        </div>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Section renderer — each shape is rendered with a permissive fallback.
// ---------------------------------------------------------------------------

function SectionRenderer({
  section,
}: {
  section: Record<string, unknown>;
}) {
  const kind = (section.kind as string) ?? "rich_text";
  if (kind === "rich_text") {
    const body = (section.body_md as string) ?? "";
    if (!body.trim()) return null;
    return (
      <div className="prose prose-stone max-w-none text-haven-charcoal">
        {body.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="text-[15.5px] leading-relaxed">
            {renderInlineMd(para)}
          </p>
        ))}
      </div>
    );
  }
  if (kind === "bullets") {
    const items = Array.isArray(section.items) ? (section.items as string[]) : [];
    const heading = (section.heading as string) ?? "";
    if (items.length === 0) return null;
    return (
      <div>
        {heading ? (
          <h2 className="font-heading text-[22px] font-bold uppercase tracking-[1.5px] text-haven-charcoal">
            {heading}
          </h2>
        ) : null}
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-3 text-[15px] leading-relaxed text-haven-charcoal"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF564E]" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (kind === "stat_band") {
    type Stat = { value: string; label: string };
    const stats = Array.isArray(section.stats) ? (section.stats as Stat[]) : [];
    if (stats.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#EDF0EE] p-6 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-heading text-[32px] font-bold text-haven-charcoal">
              {s.value}
            </div>
            <div className="text-[11px] uppercase tracking-[1.5px] text-haven-charcoal/70">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "faq") {
    type Item = { q: string; a: string };
    const items = Array.isArray(section.items) ? (section.items as Item[]) : [];
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className="font-heading text-[22px] font-bold uppercase tracking-[1.5px] text-haven-charcoal">
          FAQ
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-xl border border-haven-charcoal/10 bg-white p-4"
            >
              <div className="font-semibold text-haven-charcoal">{it.q}</div>
              <p className="mt-1 text-[14.5px] leading-relaxed text-haven-charcoal/80">
                {it.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "cta_block") {
    const heading = (section.heading as string) ?? "";
    const body = (section.body as string) ?? "";
    return (
      <div className="rounded-2xl bg-haven-charcoal px-6 py-8 text-white">
        {heading ? (
          <h2 className="font-heading text-[24px] font-bold uppercase tracking-[1.5px]">
            {heading}
          </h2>
        ) : null}
        {body ? (
          <p className="mt-2 text-[15px] leading-relaxed text-white/90">{body}</p>
        ) : null}
      </div>
    );
  }

  // Unknown kind — silently ignore.
  return null;
}

function DefaultBody({ title }: { title: string }) {
  return (
    <div className="prose prose-stone max-w-none">
      <p className="text-[15.5px] leading-relaxed text-haven-charcoal">
        Thanks for stopping by. <strong>{title}</strong> is on the way — fill in
        your details on the right and we'll send it over right away.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny inline markdown — bold, italic, links. Server-rendered, no eval.
// ---------------------------------------------------------------------------

function renderInlineMd(text: string): React.ReactNode {
  // Order matters: links → bold → italic.
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;
  while (true) {
    const m = remaining.match(linkRe);
    if (!m) break;
    const before = remaining.slice(0, m.index);
    parts.push(<span key={key++}>{applyBoldItalic(before, () => key++)}</span>);
    parts.push(
      <a
        key={key++}
        href={m[2]}
        target="_blank"
        rel="noreferrer"
        className="text-[#FF564E] underline-offset-2 hover:underline"
      >
        {m[1]}
      </a>,
    );
    remaining = remaining.slice((m.index ?? 0) + m[0].length);
  }
  parts.push(<span key={key++}>{applyBoldItalic(remaining, () => key++)}</span>);
  return parts;
}

function applyBoldItalic(text: string, nextKey: () => number): React.ReactNode {
  // Bold: **text**
  const out: React.ReactNode[] = [];
  let buf = text;
  const boldRe = /\*\*([^*]+)\*\*/;
  while (true) {
    const m = buf.match(boldRe);
    if (!m) break;
    out.push(<span key={nextKey()}>{italicize(buf.slice(0, m.index), nextKey)}</span>);
    out.push(<strong key={nextKey()}>{italicize(m[1], nextKey)}</strong>);
    buf = buf.slice((m.index ?? 0) + m[0].length);
  }
  out.push(<span key={nextKey()}>{italicize(buf, nextKey)}</span>);
  return out;
}

function italicize(text: string, nextKey: () => number): React.ReactNode {
  const out: React.ReactNode[] = [];
  let buf = text;
  const italRe = /(^|[^*])\*([^*]+)\*/;
  while (true) {
    const m = buf.match(italRe);
    if (!m) break;
    const prefix = m[1] ?? "";
    out.push(buf.slice(0, (m.index ?? 0) + prefix.length));
    out.push(<em key={nextKey()}>{m[2]}</em>);
    buf = buf.slice((m.index ?? 0) + m[0].length);
  }
  out.push(buf);
  return out;
}
