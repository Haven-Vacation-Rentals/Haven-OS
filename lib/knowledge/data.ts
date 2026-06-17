export type KnowledgeCategory = {
  slug: string;
  title: string;
  description: string;
};

export type KnowledgeSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

export type KnowledgeArticle = {
  slug: string;
  title: string;
  categorySlug: string;
  summary: string;
  tags: string[];
  sourceUrl: string;
  popular?: boolean;
  sections: KnowledgeSection[];
};

export const knowledgeCategories: readonly KnowledgeCategory[] = [
  {
    slug: "hostaway",
    title: "Hostaway",
    description: "Owner portal access, calendars, reservations, and listing links.",
  },
  {
    slug: "onboarding",
    title: "Onboarding Hub",
    description: "Insurance, permits, photography, payments, and transfer steps for new owners.",
  },
  {
    slug: "revenue",
    title: "Revenue, Pricing & Payments",
    description: "Pricing strategy, monthly statements, direct deposits, and owner payout timing.",
  },
  {
    slug: "maintenance",
    title: "Maintenance & Owner Approvals",
    description: "Maintenance workflows, hot tub service, and repair approval requests.",
  },
  {
    slug: "documents",
    title: "Documents from Sevier County",
    description: "County forms and informational resources for local property requirements.",
  },
  {
    slug: "guest-operations",
    title: "Guest Operations FAQs",
    description: "How guest-facing operational items appear on owner statements.",
  },
  {
    slug: "owner-stays",
    title: "Owner Stays & Cleaning",
    description: "Owner codes, owner stay cleaning, and cleaning scope expectations.",
  },
] as const;

export const knowledgeArticles: readonly KnowledgeArticle[] = [
  {
    slug: "how-do-i-use-hostaway",
    title: "How do I use Hostaway?",
    categorySlug: "hostaway",
    summary: "Set up the Hostaway owner portal and use the monthly calendar to view bookings, listing links, and nightly rates.",
    tags: ["Hostaway", "Owner portal", "Calendar"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/how-do-i-use-hostaway",
    popular: true,
    sections: [
      {
        heading: "Owner portal setup",
        body: [
          "During onboarding, Haven creates your Hostaway user. Hostaway sends a registration email to your inbox with the username and password needed to sign in.",
          "After login, Hostaway prompts two-factor authentication. Retrieve the authentication code from your email to finish signing in and reach the Hostaway dashboard.",
        ],
      },
      {
        heading: "Using the calendar",
        bullets: [
          "Open the Calendar tab and choose the Monthly view.",
          "If you have multiple properties, use the listing dropdown to move between calendars.",
          "Newly onboarded properties are typically active only on Airbnb during their first month in the program.",
          "Booked reservations are highlighted on the calendar, while open nights remain visible as available dates.",
          "Each calendar date displays the nightly rate and minimum night requirement set for that date.",
        ],
      },
      {
        heading: "Video walkthrough",
        body: ["The source article includes a Loom walkthrough for the Hostaway calendar: https://www.loom.com/share/e75561120e0f4474b01d0d8dfb2bd6dc"],
      },
    ],
  },
  {
    slug: "insurance-for-short-term-rentals",
    title: "Insurance for Short Term Rentals",
    categorySlug: "onboarding",
    summary: "Haven requires commercial liability coverage for short term rental activity and must be listed as additional insured.",
    tags: ["Insurance", "Onboarding", "Liability"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/insurance-for-short-term-rentals",
    popular: true,
    sections: [
      {
        heading: "Coverage requirement",
        body: [
          "Commercial liability insurance protects short term rental owners from financial risks that can arise during guest stays, including bodily injury, property damage, and legal expenses.",
          "A standard homeowners policy typically does not cover short term rental activity because it is considered a business operation.",
          "Haven requires owners to maintain a commercial liability policy with at least $1 million in coverage.",
        ],
      },
      {
        heading: "Additional insured",
        body: ["Haven must be listed as additional insured in the policy declaration:"],
        bullets: [
          "Haven Vacation Rentals, LLC",
          "9234 Kingston Pike #360",
          "Knoxville, TN 37922",
        ],
      },
      {
        heading: "Important note",
        body: [
          "Haven is not an insurance broker or agency and cannot provide coverage, interpret policy terms, or recommend coverage levels. Consult a licensed insurance professional for policy guidance.",
          "Owners should upload a copy of their declarations through the onboarding link provided by Haven.",
        ],
      },
    ],
  },
  {
    slug: "short-term-rental-permitting",
    title: "Local Short Term Rental Permitting",
    categorySlug: "onboarding",
    summary: "A practical overview of permit and license requirements for Sevier County, Sevierville, Gatlinburg, Pittman Center, and Knoxville-area properties.",
    tags: ["Permits", "Licensing", "Onboarding"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/short-term-rental-permitting",
    popular: true,
    sections: [
      {
        heading: "Sevier County",
        body: [
          "For properties outside city limits, Sevier County requires an annual short-term rental unit permit and yearly inspection. The program is designed to confirm minimum safety standards.",
          "Haven files the application on your behalf. Owners receive a Dotloop link to complete owner-specific information and sign before submission.",
        ],
        bullets: [
          "Annual application cost is $250 for a rental that sleeps 12 or fewer guests.",
          "For rentals that sleep 13 or more, the cost is $250 plus $25 per additional occupant.",
          "If floor plans are not available, Haven may need to schedule photography to generate evacuation-route floor plans. The crawl lists $100 for the first floor and $50 per additional floor.",
        ],
      },
      {
        heading: "City requirements",
        bullets: [
          "City of Sevierville: short-term rental requirements apply inside city limits.",
          "City of Gatlinburg: a Tourist Residency Permit is required. The crawl lists a $200 application fee for a two-bedroom-or-smaller unit plus $75 for each bedroom over two.",
          "City of Pittman Center: a Tourist Residency Permit is required.",
          "Knoxville area outside city limits: owners must obtain a Knox County business license and provide Haven a copy during onboarding.",
          "Inside Knoxville city limits: owners must obtain Knox County and City of Knoxville business licenses before Haven can open the calendar and file the STRU permit application.",
        ],
      },
    ],
  },
  {
    slug: "pricing-during-onboarding",
    title: "Pricing on a New Listing",
    categorySlug: "onboarding",
    summary: "Why Haven uses the first 1-3 months to build credibility, earn reviews, and move a new listing toward premium positioning.",
    tags: ["Pricing", "Onboarding", "Reviews"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/pricing-during-onboarding",
    popular: true,
    sections: [
      {
        heading: "The build phase",
        body: [
          "During the first 90 days, Haven focuses on establishing listing credibility as quickly as possible so the property can command stronger rates over time.",
          "The first 1-3 months are treated as build months: drive bookings quickly, accumulate 5-star reviews, improve listing visibility, and position the property for higher average nightly rates later.",
        ],
      },
      {
        heading: "Revenue levers Haven optimizes",
        bullets: [
          "Listing credibility through early positive reviews.",
          "Account credibility through strong host reputation and Superhost qualification.",
          "Professional photos and marketing to improve click-through and conversion.",
          "Desirable amenities such as hot tubs, indoor pools, pet-friendly policies, and game rooms.",
          "Temporary launch pricing flexibility to secure bookings and reviews before raising rates.",
        ],
      },
      {
        heading: "Owner takeaways",
        bullets: [
          "Expect short-term pricing adjustments at launch.",
          "The goal is to build a credible, high-converting listing quickly.",
          "Within 1-3 months, Haven aims to shift from growth pricing to premium positioning.",
          "Haven actively manages major revenue levers on the owner's behalf.",
        ],
      },
    ],
  },
  {
    slug: "when-will-i-get-paid",
    title: "When will I get paid?",
    categorySlug: "onboarding",
    summary: "Owner payouts are completed monthly in arrears, with statements sent shortly before funds arrive.",
    tags: ["Payouts", "Bill.com", "Statements"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/when-will-i-get-paid",
    popular: true,
    sections: [
      {
        heading: "Monthly payout timing",
        body: [
          "Haven completes owner payouts on the 25th of every month. Payouts are completed in arrears because reservations must go through close-of-books and reconciliation.",
          "For example, funds for October reservations are paid out in November.",
        ],
      },
      {
        heading: "Notifications and statements",
        bullets: [
          "Bill.com sends an email notification when funds are on the way. No owner action is required from that email.",
          "Owners receive an itemized statement by email 1-2 days before the payout reaches their bank account.",
          "The onboarding invoice may be deducted from rental proceeds during the first and/or second month of income.",
        ],
      },
    ],
  },
  {
    slug: "contact-resources",
    title: "Contact Resources",
    categorySlug: "onboarding",
    summary: "Use the shared owner relations inbox for the fastest response, with phone contacts available during business hours.",
    tags: ["Contact", "Operations", "Support"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/contact-resources",
    sections: [
      {
        heading: "Best contact channel",
        body: [
          "Email is the best way to reach Haven because daily workflows are centered around the shared inbox. It is monitored by multiple team members so requests do not depend on a single person.",
          "Use ownerrelations@havenvacationrentals.com for standard owner operations questions.",
        ],
      },
      {
        heading: "Response expectations",
        body: ["For standard operations, Haven's goal is to reply by the end of the same business day. In the rare event of a delay, owners can expect a response within 24 business hours."],
      },
      {
        heading: "Directory from the source article",
        bullets: [
          "Account manager Lily: (423) 820-0112, Monday-Friday 8:30am-5pm.",
          "Account manager Regina: (865) 412-4753, Monday-Friday 8:30am-5pm.",
          "Account manager Katie: (865) 381-3442, Monday-Friday 8:30am-5pm.",
          "Realtor or door-code related requests, text only: (865) 505-7834.",
          "After-hours emergency on-call, text preferred: (865) 505-7959.",
        ],
      },
    ],
  },
  {
    slug: "how-to-set-up-bill-com",
    title: "How to Set Up Bill.com",
    categorySlug: "onboarding",
    summary: "Bill.com is used to send owner rental proceeds by direct deposit during onboarding.",
    tags: ["Bill.com", "Direct deposit", "Onboarding"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/how-to-set-up-bill.com",
    sections: [
      {
        heading: "Invitation and account creation",
        bullets: [
          "Haven sends a Bill.com invitation email during onboarding.",
          "Open the invite, choose Set Up ePayments, and create your BILL account.",
          "Some owner or business information may already be pre-filled by Haven.",
          "Enter a mobile number for two-step verification and submit the six-digit code.",
          "When asked about other BILL features, select No.",
        ],
      },
      {
        heading: "Banking details",
        body: ["After account creation, enter the bank account where you want to receive rental proceeds. Business owners may be asked for company or LLC information because of federal compliance requirements."],
      },
    ],
  },
  {
    slug: "transfer-guest-process",
    title: "Transfer Guest Process",
    categorySlug: "onboarding",
    summary: "How owners with existing Airbnb bookings help move guests onto Haven's managed listing without changing dates or rates.",
    tags: ["Airbnb", "Guest transfer", "Onboarding"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/transfer",
    sections: [
      {
        heading: "Owner preparation",
        bullets: [
          "Provide Haven a breakdown of each reservation, including guest name, booked dates, contact information, and booked rates.",
          "Send guests the transfer message from the source article explaining that a professional property manager will host the stay and honor the same dates and rates.",
          "Include the Haven Airbnb listing link, which can be found in Hostaway.",
          "Cancel each reservation from the owner's Airbnb account and provide Airbnb support a copy of the service agreement as proof the bookings will be honored.",
        ],
      },
      {
        heading: "Why this process is used",
        bullets: [
          "Guests receive a full refund immediately.",
          "Once refunded, guests can rebook the same dates at the same price under Haven's listing.",
          "Guest communication, check-in instructions, cleaning schedules, and support move into Haven's system.",
          "The process avoids duplicate-listing confusion and clarifies who guests should contact.",
        ],
      },
    ],
  },
  {
    slug: "photo-packages",
    title: "Photo Packages",
    categorySlug: "onboarding",
    summary: "Photography package options owners select during onboarding to improve listing conversion.",
    tags: ["Photography", "Marketing", "Onboarding"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/photo-packages",
    sections: [
      {
        heading: "Why photos matter",
        body: ["Listing photos are the first impression guests see. Strong photography improves click-through, communicates the experience, and helps a property stand out in a competitive Smoky Mountain market."],
      },
      {
        heading: "Package options from the crawl",
        bullets: [
          "Economy Package: recommended only for condos and one-bedroom cabins. The crawl lists $450 for up to 4 bedrooms and $600 for 5+ bedrooms.",
          "TFREP Media Starter Package: listed at $900 and commonly used for 2-4 bedroom cabins or homes.",
          "TFREP Media Deluxe Short Term Rental Package: listed at $1,100 and recommended for large or unique properties.",
          "TFREP Media Luxury Package: listed at $1,950 and recommended for ultra-luxury or tailored marketing packages.",
        ],
      },
      {
        heading: "Common deliverables",
        body: ["Packages may include interior and exterior photos, drone photos, vertical detail photos, virtual twilight images, seasonal edits, community amenity photos, and lifestyle imagery depending on the selected package."],
      },
    ],
  },
  {
    slug: "why-owner-set-pricing-less-revenue",
    title: "Why Owner Set Pricing = Less Revenue",
    categorySlug: "revenue",
    summary: "Hard nightly minimums can reduce visibility, occupancy, reviews, and total monthly revenue.",
    tags: ["Pricing", "Revenue", "Dynamic rates"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/why-owner-set-pricing-less-revenue-",
    popular: true,
    sections: [
      {
        heading: "Search visibility",
        body: ["Booking platforms sort properties by relevance and competitiveness. When a property is consistently priced above market because of a hard minimum, it can be pushed down in search results and receive fewer clicks."],
      },
      {
        heading: "Revenue over time",
        body: ["Dynamic pricing focuses on total monthly and long-term performance, not the highest possible rate on a single night. Lower-rate bookings can fill gaps, increase occupancy, and support stronger total revenue."],
      },
      {
        heading: "Momentum and fill-in nights",
        bullets: [
          "More bookings create more opportunities for positive reviews.",
          "Positive reviews improve ranking and support higher future nightly rates.",
          "Hard minimums often block one-night or short gap bookings that would otherwise be lost revenue.",
          "Haven uses revenue management tools with market data, seasonality, demand, and property-specific thresholds.",
        ],
      },
    ],
  },
  {
    slug: "pricing-strategy",
    title: "Haven's Pricing Strategy",
    categorySlug: "revenue",
    summary: "Haven uses customized dynamic pricing based on market signals, listing tier, booking window, seasonality, and occupancy trends.",
    tags: ["Pricing", "Revenue management", "Seasonality"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/pricing-strategy",
    popular: true,
    sections: [
      {
        heading: "Dynamic rate adjustments",
        body: ["Nightly rates are not fixed. They fluctuate based on market indicators so Haven can stay competitive while capturing value on high-demand dates."],
        bullets: [
          "Day of week and weekend demand.",
          "Seasonality and historical revenue trends.",
          "Local events, festivals, holidays, and conferences.",
          "Booking lead time, including early booking premiums and last-minute discounts.",
          "Competitor pricing and local occupancy trends.",
        ],
      },
      {
        heading: "Listing tiers",
        bullets: [
          "Tier 1: upscale listings, including luxury custom homes with premium views or amenities.",
          "Tier 2: midscale listings with standard amenities, hot tubs, good location, and common guest appeal.",
          "Tier 3: base-scale listings with remote locations, fewer attractors, or limited amenities.",
        ],
      },
      {
        heading: "Ongoing optimization",
        body: ["Haven monitors ranking health, comparable pricing, minimum-night requirements, booking window behavior, and gap-filling opportunities. The source crawl notes Haven's typical booking window is 30 days or less."],
      },
    ],
  },
  {
    slug: "haven-owner-statements",
    title: "Haven Owner Statements",
    categorySlug: "revenue",
    summary: "How to read monthly owner statement lines from taxable revenue through net owner payout.",
    tags: ["Statements", "Revenue", "Payouts"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/haven-owner-statements",
    popular: true,
    sections: [
      {
        heading: "Revenue and deductions",
        body: [
          "The total taxable revenue line includes funds collected from each reservation, including nightly rent, cleaning fees, channel service fees, and taxes. It is not the true rent number.",
          "Housekeeping or cleaning fees are deducted from total taxable revenue and paid out to cleaners on the owner's behalf.",
        ],
      },
      {
        heading: "Common statement lines",
        bullets: [
          "Channel service fees are charged by booking platforms such as Airbnb, Vrbo, and Booking.com.",
          "Credit card fees apply when Haven processes guest payment directly, such as direct-site reservations. Haven does not mark these up.",
          "Gross receipts tax and business tax are paid on the owner's behalf for operating the short term rental unit.",
          "Gross rent is the true revenue line after listed business deductions and is used to calculate commission.",
          "PM commission is deducted from gross rent.",
          "Owner or friend stays may show a cleaning fee deducted after commission.",
          "Repairs, vendor expenses, and property purchases appear under Repairs & Misc.",
          "Net owner payout is the final amount due after all expenses.",
        ],
      },
    ],
  },
  {
    slug: "how-to-set-up-clearing-portal",
    title: "How to Set Up Clearing Portal",
    categorySlug: "revenue",
    summary: "Set up the Clearing owner portal for direct deposits, bank account assignment, and updated statement access.",
    tags: ["Clearing", "Direct deposit", "Statements"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/how-to-set-up-clearing-portal",
    sections: [
      {
        heading: "Account setup",
        bullets: [
          "Create your account using the email invite link.",
          "Log in and go to Manage Bank Accounts.",
          "Click Add a New Bank Account.",
          "Enter name or LLC name as titled, email address, account type, bank account and routing numbers, and tax ID.",
          "Assign each bank account to the correct property or listing. Multi-property owners need to add and assign each account to the corresponding property.",
        ],
      },
      {
        heading: "Statement changes",
        body: ["Owner statements will live in the Clearing portal with updated reporting tools. The crawl notes that statements move to checkout-date reporting beginning January 2026, with December reported based on prorated days."],
      },
    ],
  },
  {
    slug: "hot-tub-maintenance",
    title: "Hot Tub Maintenance",
    categorySlug: "maintenance",
    summary: "Hot tubs are serviced at each checkout, with extra considerations for well water, covers, and replacement planning.",
    tags: ["Hot tubs", "Maintenance", "Vendors"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/hot-t",
    sections: [
      {
        heading: "Turn service",
        body: ["At each checkout, hot tubs are drained, wiped out, refilled, and chemically treated. Filters are rinsed and replaced as needed, and new bromine is added every turn."],
      },
      {
        heading: "Owner considerations",
        bullets: [
          "Properties on well water typically need an acid wash and system purge twice per year. Account management will alert owners when this applies.",
          "Hot tub covers are attractive to bears in high-activity areas and may be damaged over time.",
          "When repair costs become too high on an older tub, Haven recommends considering replacement with a hard-top interconnected unit.",
          "The crawl lists March 2025 example pricing for one vendor: $6,395 for the unit, $475 delivery and installation, $175 removal and disposal, and $400-$570 for a crane if needed.",
        ],
      },
    ],
  },
  {
    slug: "maintenance-process-for-owner-approvals",
    title: "Maintenance Process for Owner Approvals",
    categorySlug: "maintenance",
    summary: "Owner approval requests are sent through Breezeway so repair details, estimates, and attachments stay organized.",
    tags: ["Maintenance", "Approvals", "Breezeway"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/maintenance-process-for-owner-approvals",
    popular: true,
    sections: [
      {
        heading: "How approvals arrive",
        bullets: [
          "Approval requests come from notifications@breezeway.io.",
          "The subject line is similar to Action Required: Haven Vacation Rentals Requested Your Approval on a Task.",
          "Owners can review task details, estimates, and attachments, then approve or reject the request.",
          "The first email may go to spam or junk, so owners should mark Breezeway as a safe sender.",
        ],
      },
      {
        heading: "Point of contact",
        body: ["The software only allows one approval email address per property. The account manager designates the normal point of contact or most responsive owner to receive requests."],
      },
    ],
  },
  {
    slug: "sevier-county-tangible-property-tax",
    title: "Sevier County Tangible Property Tax Filing",
    categorySlug: "documents",
    summary: "Informational notes about Sevier County tangible property tax packets and valuation schedule options.",
    tags: ["Sevier County", "Tax", "Documents"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/sevier-county-tangible-property-tax",
    sections: [
      {
        heading: "Disclaimer",
        body: ["This content is for general informational purposes only and is not tax, legal, or financial advice. Haven is not a tax preparer, CPA, or attorney and does not provide guidance on how to complete or submit tax forms. Consult a licensed professional for your specific situation."],
      },
      {
        heading: "Filing options mentioned in the crawl",
        bullets: [
          "Square footage valuation accepts the average valuation shown for the rental unit based on property square footage, in lieu of itemizing all tangible property in the cabin.",
          "Standard value valuation requires reporting personal property owned and used or held for business use as of January 1.",
          "Small accounts may have an alternate certification path if depreciated property value is $1,000 or less, subject to audit.",
        ],
      },
      {
        heading: "How Haven can assist",
        body: ["Haven cannot complete itemized asset or tangible property lists. If owners need a make or model for a specific appliance or major item, the account manager may be able to locate that information in the maintenance file."],
      },
    ],
  },
  {
    slug: "guest-damage-protection-plan",
    title: "Guest Damage Protection Plan",
    categorySlug: "guest-operations",
    summary: "The guest-paid damage protection line item covers qualifying guest-related damage up to $1,500 during a stay.",
    tags: ["Guest damage", "Statements", "Protection"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/guest-damage-protection-plan",
    sections: [
      {
        heading: "What the fee covers",
        body: ["The Guest Damage Protection Plan is a fee paid by the guest in addition to nightly rates and cleaning fees. It covers up to $1,500 in qualifying guest-related damage for the duration of the stay."],
      },
      {
        heading: "What it does not cover",
        body: ["The policy does not cover normal wear and tear, pre-existing defects, or breakage of poor-quality or improperly maintained items. It is specifically intended for guest-related damage."],
      },
    ],
  },
  {
    slug: "owner-stay-cleaning",
    title: "Owner Stay Cleaning",
    categorySlug: "owner-stays",
    summary: "Owner stays generally use the same checkout cleaning standards as guest stays, with narrow exceptions for small owner-only trips.",
    tags: ["Owner stays", "Cleaning", "Housekeeping"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/owner-stay-cleaning",
    popular: true,
    sections: [
      {
        heading: "Cleaning fee discount",
        body: ["There is no owner discount on housekeeping fees. Haven charges housekeeping at cost for guests and owners, and cleaners perform the same checkout procedure to ensure the property is guest-ready for the next stay."],
      },
      {
        heading: "Cleaning the property yourself",
        body: ["Whether an owner can clean after their own stay depends on the property and trip type."],
        bullets: [
          "If the property has a pool, owners cannot clean it themselves because the pool must be serviced by a vendor on every departure.",
          "If traveling alone or with immediate family, owners may clean themselves only if they bring their own linens and consumables.",
          "White linens must be folded and stored away, not used, washed, and returned to the beds.",
          "Haven typically recommends self-cleaning only for stays with no more than two people using one bed.",
          "If traveling with friends or extended family, owners cannot clean the property themselves.",
        ],
      },
    ],
  },
  {
    slug: "what-is-my-owner-code",
    title: "What is my Owner Code?",
    categorySlug: "owner-stays",
    summary: "Owner codes are created during onboarding and are based on the internal listing contact in Hostaway.",
    tags: ["Owner code", "Hostaway", "Owner stays"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/what-is-my-owner-code",
    sections: [
      {
        heading: "How the code is created",
        body: ["Haven creates a unique owner code for each property during onboarding. The owner code is always active and can always be used."],
      },
      {
        heading: "Finding the code",
        body: ["The owner code is the last four digits of the phone number for the person listed as the internal listing name in Hostaway. To identify that person, open Hostaway, choose Calendar, then Monthly. The name appears on the right side of the calendar."],
      },
    ],
  },
  {
    slug: "turn-clean-vs-deep-clean",
    title: "Turn Clean vs Deep Clean",
    categorySlug: "owner-stays",
    summary: "Turn cleans prepare a home between stays; deep cleans are broader periodic resets required at least annually.",
    tags: ["Cleaning", "Deep clean", "Turn clean"],
    sourceUrl: "https://20715840.hs-sites.com/knowledge/turn-clean-vs-deep-clean",
    sections: [
      {
        heading: "Turn clean",
        body: ["A turn clean is a fast, efficient cleaning performed between guest stays so the property is guest-ready. It focuses on sanitation, restocking, basic functionality, and same-day readiness."],
        bullets: [
          "Completed after every guest and owner checkout.",
          "Focuses on bathrooms, kitchens, floors, consumables, TVs, remotes, hot tubs, and other readiness checks.",
          "Includes photo documentation of key rooms and amenity conditions.",
        ],
      },
      {
        heading: "Deep clean",
        body: ["A deep clean is a top-to-bottom reset that tackles built-up grime, hidden debris, and longer-term wear. All properties are required to be deep cleaned annually, and Haven recommends bi-annual deep cleans for pet-friendly properties."],
        bullets: [
          "Can take up to three days.",
          "The crawl states a deep clean costs three times more than a standard clean because of the increased scope.",
          "Includes cleaning behind and under furniture and appliances, full detailing of appliances and bathrooms, wall and blind attention, and broader replacement or restocking checks.",
        ],
      },
    ],
  },
] as const;

export const knowledgeCategoryMap: ReadonlyMap<string, KnowledgeCategory> = new Map(
  knowledgeCategories.map((category) => [category.slug, category]),
);

export const knowledgeArticleMap: ReadonlyMap<string, KnowledgeArticle> = new Map(
  knowledgeArticles.map((article) => [article.slug, article]),
);

export function getKnowledgeArticle(slug: string) {
  return knowledgeArticleMap.get(slug);
}

export function getKnowledgeCategory(slug: string) {
  return knowledgeCategoryMap.get(slug);
}

export function getKnowledgeArticlesByCategory(categorySlug: string) {
  return knowledgeArticles.filter((article) => article.categorySlug === categorySlug);
}

export function getRelatedKnowledgeArticles(article: KnowledgeArticle) {
  return getKnowledgeArticlesByCategory(article.categorySlug).filter(
    (related) => related.slug !== article.slug,
  );
}
