/**
 * Expired lead magnet — shown when /lead-magnet/<slug> has passed
 * expires_at, been archived, or is still in draft. Friendly contact page.
 */

export function ExpiredLeadMagnet({ title }: { title: string }) {
  return (
    <main className="min-h-dvh bg-haven-white">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <a
          href="https://havenvacationrentals.com"
          className="mb-8"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://havenvacationrentals.com/wp-content/uploads/2023/07/Haven-Logo-Black-Transparent-4.png"
            alt="Haven Vacation Rentals"
            className="h-12 w-auto"
          />
        </a>

        <div className="haven-eyebrow text-[#FF564E] tracking-[2px]">
          This page is no longer available
        </div>
        <h1 className="mt-3 font-heading text-[36px] font-bold leading-[1.1] uppercase text-haven-charcoal sm:text-[48px]">
          {title || "This resource"}
          <br />
          isn't live right now.
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-haven-charcoal/80">
          The campaign you're looking for has either ended or is still in
          progress. We'd still love to talk — Haven manages short-term rentals
          across the Smokies and we're always happy to share what we're seeing.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="mailto:hello@havenvacationrentals.com"
            className="inline-flex items-center justify-center gap-2 rounded-[30px] bg-[#FF564E] px-7 py-3 text-[14px] font-black uppercase tracking-[2px] text-white transition-all hover:brightness-95"
          >
            Contact Us
          </a>
          <a
            href="https://havenvacationrentals.com/contact-us/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[30px] border border-haven-charcoal/20 bg-white px-7 py-3 text-[14px] font-black uppercase tracking-[2px] text-haven-charcoal transition-all hover:bg-haven-sage"
          >
            Visit Haven
          </a>
        </div>

        <p className="mt-12 text-[12px] text-haven-charcoal/60">
          © Haven Vacation Rentals · Pigeon Forge · Gatlinburg · Sevierville
        </p>
      </div>
    </main>
  );
}
