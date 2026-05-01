/**
 * Public lost-items intake layout — branded, no sidebar, no auth.
 * Inherits fonts and globals from app/layout.tsx (Raleway + Futura PT).
 */
export const metadata = {
  title: "Report a lost item — Haven Vacation Rentals",
  description:
    "Log a guest's lost or left-behind item with the Haven operations team.",
  robots: { index: false, follow: false },
};

export default function LostItemsIntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-haven-white text-haven-charcoal">{children}</div>;
}
