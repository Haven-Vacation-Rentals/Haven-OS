/**
 * Public clean-transition intake layout — branded, no sidebar, no auth.
 * Inherits fonts and globals from app/layout.tsx.
 */
export const metadata = {
  title: "Clean transition request — Haven Vacation Rentals",
  description:
    "Submit a new property cleaning transition and price change for Haven OS approval.",
  robots: { index: false, follow: false },
};

export default function CleanTransitionIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-haven-white text-haven-charcoal">{children}</div>;
}
