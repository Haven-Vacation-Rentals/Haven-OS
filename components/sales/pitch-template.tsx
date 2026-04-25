/**
 * PitchTemplate — the public-facing one-pager rendered at /pitch/<slug>.
 *
 * Theme: havenvacationrentals.com.
 *   - Coral #FF564E pill CTAs, uppercase + 2px letter-spacing + 900 weight
 *   - Charcoal #424242 body ink
 *   - Sage Mist #EDF0EE alternate sections
 *   - Cream #FAF8F3 warm tone for stats band
 *   - Big white uppercase hero with photo background
 *
 * All inline brand colors (hex literals) are intentional so this template
 * renders identically even if the OS Tailwind theme drifts. We avoid
 * `dark:` variants — this is a marketing surface, always light.
 */

import {
  BedDouble,
  Bath,
  Users,
  Sparkles,
  Star,
  Trophy,
  HeartHandshake,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import type { SalesPitch } from "@/lib/sales/actions";

const HAVEN_LOGO =
  "https://havenvacationrentals.com/wp-content/uploads/2023/07/Haven-Logo-Black-Transparent-4.png";

const DEFAULT_HERO =
  "https://havenvacationrentals.com/wp-content/uploads/2023/07/Smoky-Mountain-Cabin-1.jpg";

// 3 most-on-brand blog posts — Haven Standard always first.
const BLOG_LINKS: { url: string; title: string; eyebrow: string }[] = [
  {
    url: "https://havenvacationrentals.com/the-haven-standard-property-management-fixed/",
    title: "The Haven Standard: Property Management, Fixed",
    eyebrow: "Our manifesto",
  },
  {
    url: "https://havenvacationrentals.com/how-dynamic-pricing-works-for-smoky-mountain-cabins/",
    title: "How Dynamic Pricing Works for Smoky Mountain Cabins",
    eyebrow: "Pricing strategy",
  },
  {
    url: "https://havenvacationrentals.com/pm-vs-self-managing-in-the-smokies-true-costs/",
    title: "PM vs. Self-Managing in the Smokies — the True Costs",
    eyebrow: "True costs",
  },
];

export function PitchTemplate({ pitch }: { pitch: SalesPitch }) {
  const ownerFirstName = pitch.owner_name.split(" ")[0] || pitch.owner_name;
  const heroImage = pitch.hero_image_url || DEFAULT_HERO;
  const formattedRange = formatProjectionRange(
    pitch.projection_low,
    pitch.projection_high,
  );

  return (
    <main className="min-h-dvh bg-white text-[#424242]">
      {/* ============================================================
       * HEADER NAV
       * ============================================================ */}
      <header className="border-b border-[#E2E4E2] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <a href="https://havenvacationrentals.com" target="_blank" rel="noreferrer">
            <img src={HAVEN_LOGO} alt="Haven Vacation Rentals" className="h-9 w-auto" />
          </a>
          <a
            href="mailto:jack@havenvacationrentals.com"
            className="hidden items-center gap-2 rounded-[30px] bg-[#FF564E] px-5 py-2 text-[12px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95 sm:inline-flex"
          >
            Talk to Jack
          </a>
        </div>
      </header>

      {/* ============================================================
       * HERO — owner-personalized, photo background
       * ============================================================ */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/45 to-black/70"
          aria-hidden
        />

        <div className="mx-auto max-w-[1200px] px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="text-[12px] font-black uppercase tracking-[3px] text-white/80">
              Custom proposal · Prepared for {pitch.owner_name}
            </div>
            <h1 className="mt-4 font-heading text-[44px] font-black uppercase leading-[1.05] text-white sm:text-[64px]">
              {ownerFirstName}, your cabin
              <br />
              deserves <span className="text-[#FF564E]">Haven.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/90 sm:text-[18px]">
              We built Haven so Smoky Mountain cabin owners could finally have
              a property manager who actually answers the phone, prices the
              property every single day, and treats every cleaning like a
              5-star review is on the line. Here's what we think your cabin
              can do.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#projection"
                className="inline-flex items-center gap-2 rounded-[30px] bg-[#FF564E] px-7 py-3 text-[14px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95"
              >
                See the projection
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#standard"
                className="inline-flex items-center gap-2 rounded-[30px] border border-white/40 bg-white/10 px-7 py-3 text-[14px] font-black uppercase tracking-[2px] text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                The Haven Standard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * YOUR PROPERTY — at-a-glance card
       * ============================================================ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            Your Property
          </div>
          <h2 className="mt-2 font-heading text-[34px] font-bold uppercase leading-[1.15] text-[#424242] sm:text-[40px]">
            {pitch.property_address}
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Photo */}
            <div className="overflow-hidden rounded-[14px] bg-[#EDF0EE]">
              <img
                src={heroImage}
                alt={pitch.property_address}
                className="h-full w-full object-cover"
                style={{ minHeight: 280 }}
              />
            </div>

            {/* Stats card */}
            <div className="flex flex-col justify-between rounded-[14px] border border-[#E2E4E2] bg-white p-7 shadow-[0_1px_2px_rgba(66,66,66,0.06)]">
              <div className="grid grid-cols-3 gap-4">
                <PropStat icon={<BedDouble className="h-5 w-5" />} label="Bedrooms" value={fmtNum(pitch.beds)} />
                <PropStat icon={<Bath className="h-5 w-5" />} label="Bathrooms" value={fmtNum(pitch.baths)} />
                <PropStat icon={<Users className="h-5 w-5" />} label="Sleeps" value={fmtNum(pitch.sleeps)} />
              </div>
              {pitch.listing_url ? (
                <a
                  href={pitch.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-[#FF564E] hover:underline"
                >
                  View original listing
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
              <p className="mt-6 text-[13px] leading-relaxed text-[#424242]/70">
                Below is our annual gross-revenue projection for this
                property under Haven management. We arrive at this number
                from active comps, demand seasonality in the Smokies, and
                our own portfolio benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * PROJECTION
       * ============================================================ */}
      <section id="projection" className="bg-[#FAF8F3] py-20">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            Projected Annual Gross Revenue
          </div>
          <div className="mt-4 font-heading text-[60px] font-black leading-[1] text-[#424242] sm:text-[88px]">
            {formattedRange}
          </div>
          {pitch.projection_note ? (
            <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-relaxed text-[#424242]/75">
              {pitch.projection_note}
            </p>
          ) : (
            <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-relaxed text-[#424242]/75">
              Range based on active comps, full year of bookings under Haven
              management, and current Smoky Mountain demand.
            </p>
          )}

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <ProjStatCell
              big="72%"
              small="Haven portfolio occupancy"
              caption="vs ~55% market average"
            />
            <ProjStatCell
              big="Top 1%"
              small="Airbnb listings worldwide"
              caption="multiple Haven properties"
            />
            <ProjStatCell
              big="4.9★"
              small="Across thousands of stays"
              caption="3,400+ five-star reviews"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * THE HAVEN STANDARD — pillars
       * ============================================================ */}
      <section id="standard" className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            The Haven Standard
          </div>
          <h2 className="mt-3 max-w-3xl font-heading text-[34px] font-bold uppercase leading-[1.1] text-[#424242] sm:text-[44px]">
            Property management, fixed.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#424242]/80 sm:text-[16px]">
            Haven exists to honor Christ by serving and blessing people. That
            shows up in <em>how</em> we run your property — with{" "}
            <strong>faithful stewardship, excellence, humility, teamwork</strong>{" "}
            and continuous improvement. Here's what that looks like in practice.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Pillar
              icon={<TrendingUp className="h-5 w-5" />}
              title="Daily Pricing — Not Weekly. Not Monthly."
              body="We price your property every single day. Gap-night discounts, big-event premiums, and last-minute demand shifts all get captured. Your rate works as hard as you do."
            />
            <Pillar
              icon={<Sparkles className="h-5 w-5" />}
              title="5-Star Cleans, Every Time"
              body="A professional-grade cleaning operation with our See-It-Clean photo protocol. Every turnover is documented before guests arrive — no surprises, no excuses."
            />
            <Pillar
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Proactive Maintenance, In-House"
              body="We don't sub everything out and hope for the best. Our maintenance team catches issues before guests do — and before they become expensive."
            />
            <Pillar
              icon={<HeartHandshake className="h-5 w-5" />}
              title="Communication With Data"
              body="You'll know what's happening with your property — bookings, repairs, reviews, revenue — before you have to ask. We communicate proactively, with numbers."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * WHAT SETS US APART — Smokies-specific
       * ============================================================ */}
      <section className="bg-[#EDF0EE] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            What Sets Us Apart
          </div>
          <h2 className="mt-3 max-w-3xl font-heading text-[32px] font-bold uppercase leading-[1.15] text-[#424242] sm:text-[40px]">
            Built for the Smokies. Run by operators.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            <DiffCard
              eyebrow="Local"
              title="Smoky Mountain experts"
              body="We don't manage from a different state. Pigeon Forge, Gatlinburg, Sevierville — we know the cabin you're sending guests to and we know the seasons that drive its revenue."
            />
            <DiffCard
              eyebrow="Pricing"
              title="Dynamic pricing, daily"
              body="The market doesn't move once a week. Neither do we. Daily pricing is the single biggest revenue lever in this market — and it's the one most managers ignore."
            />
            <DiffCard
              eyebrow="Care"
              title="5-star care, end to end"
              body="From the first inquiry to the final review, we treat every guest stay like a 5-star review is on the line. (It is.) That's how you get to a 4.9 with thousands of reviews."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
       * TRUST — stats band
       * ============================================================ */}
      <section className="bg-[#424242] py-20 text-white">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            By the Numbers
          </div>
          <h2 className="mt-3 max-w-3xl font-heading text-[34px] font-bold uppercase leading-[1.1] text-white sm:text-[44px]">
            The receipts.
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            <TrustStat icon={<Star />} big="4.9" sub="Airbnb Superhost" />
            <TrustStat icon={<Star />} big="4.9" sub="Google · ~4,000 reviews" />
            <TrustStat icon={<TrendingUp />} big="72%" sub="Occupancy vs 55% market" />
            <TrustStat icon={<Trophy />} big="Top 100" sub="Comparent Market Leader" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 text-[14px] leading-relaxed text-white/80 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF564E]" />
              Multiple properties ranked Top 1% / 5% / 10% on Airbnb worldwide
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF564E]" />
              In-house cleaning, maintenance, guest care, and revenue management
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF564E]" />
              Proactive owner reporting — you'll know before you have to ask
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF564E]" />
              Christian-owned, operator-led, locally based in the Smokies
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * KEEP READING — blog links
       * ============================================================ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-[12px] font-black uppercase tracking-[3px] text-[#FF564E]">
            Keep Reading
          </div>
          <h2 className="mt-3 max-w-3xl font-heading text-[30px] font-bold uppercase leading-[1.15] text-[#424242] sm:text-[36px]">
            How we think about your property.
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {BLOG_LINKS.map((b) => (
              <a
                key={b.url}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col rounded-[14px] border border-[#E2E4E2] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(66,66,66,0.08)]"
              >
                <div className="text-[11px] font-black uppercase tracking-[2px] text-[#FF564E]">
                  {b.eyebrow}
                </div>
                <div className="mt-3 font-heading text-[18px] font-bold leading-[1.25] text-[#424242] group-hover:text-[#FF564E]">
                  {b.title}
                </div>
                <div className="mt-auto pt-5 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#FF564E]">
                  Read on Haven →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * FINAL CTA
       * ============================================================ */}
      <section className="bg-[#FAF8F3] py-20">
        <div className="mx-auto max-w-[900px] px-6 text-center">
          <h2 className="font-heading text-[36px] font-black uppercase leading-[1.05] text-[#424242] sm:text-[52px]">
            Ready to see what
            <br />
            <span className="text-[#FF564E]">Haven</span> can do for you?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#424242]/80">
            Reach out and we'll set up a 20-minute call to walk through this
            projection, answer your questions, and lay out exactly what
            onboarding looks like.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:jack@havenvacationrentals.com"
              className="inline-flex items-center gap-2 rounded-[30px] bg-[#FF564E] px-8 py-3.5 text-[14px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95"
            >
              Email Jack
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://havenvacationrentals.com/contact-us/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[30px] border border-[#424242]/20 bg-white px-8 py-3.5 text-[14px] font-black uppercase tracking-[2px] text-[#424242] transition-all hover:bg-[#EDF0EE]"
            >
              Book a call
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================
       * FOOTER
       * ============================================================ */}
      <footer className="border-t border-[#E2E4E2] bg-white py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 text-center md:flex-row md:text-left">
          <a href="https://havenvacationrentals.com" target="_blank" rel="noreferrer">
            <img src={HAVEN_LOGO} alt="Haven Vacation Rentals" className="h-8 w-auto" />
          </a>
          <div className="text-[12px] text-[#424242]/60">
            This proposal expires{" "}
            <strong className="text-[#424242]">
              {new Date(pitch.expires_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
            . Prepared exclusively for {pitch.owner_name}.
          </div>
          <div className="text-[12px] text-[#424242]/60">
            © Haven Vacation Rentals
          </div>
        </div>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PropStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE4E2] text-[#FF564E]">
        {icon}
      </div>
      <div className="mt-2 font-heading text-[28px] font-bold leading-none text-[#424242]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[1.5px] text-[#424242]/60">
        {label}
      </div>
    </div>
  );
}

function ProjStatCell({
  big,
  small,
  caption,
}: {
  big: string;
  small: string;
  caption: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#E2E4E2] bg-white p-5 text-left">
      <div className="font-heading text-[28px] font-black leading-none text-[#FF564E]">
        {big}
      </div>
      <div className="mt-1 text-[13px] font-bold text-[#424242]">{small}</div>
      <div className="mt-0.5 text-[11px] text-[#424242]/60">{caption}</div>
    </div>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#E2E4E2] bg-white p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FFE4E2] text-[#FF564E]">
        {icon}
      </div>
      <div className="mt-3 font-heading text-[20px] font-bold leading-[1.2] text-[#424242]">
        {title}
      </div>
      <div className="mt-2 text-[14px] leading-relaxed text-[#424242]/80">
        {body}
      </div>
    </div>
  );
}

function DiffCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] bg-white p-6 shadow-[0_1px_2px_rgba(66,66,66,0.06)]">
      <div className="text-[11px] font-black uppercase tracking-[2px] text-[#FF564E]">
        {eyebrow}
      </div>
      <div className="mt-2 font-heading text-[20px] font-bold leading-[1.2] text-[#424242]">
        {title}
      </div>
      <div className="mt-3 text-[14px] leading-relaxed text-[#424242]/80">
        {body}
      </div>
    </div>
  );
}

function TrustStat({
  icon,
  big,
  sub,
}: {
  icon: React.ReactNode;
  big: string;
  sub: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-5">
      <div className="text-[#FF564E]">
        <span className="inline-flex h-5 w-5">{icon}</span>
      </div>
      <div className="mt-2 font-heading text-[36px] font-black leading-none">
        {big}
      </div>
      <div className="mt-1 text-[12px] font-semibold text-white/70">{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtNum(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function formatProjectionRange(low: number, high: number): string {
  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n}`;
  };
  return `${fmt(low)} – ${fmt(high)}`;
}
