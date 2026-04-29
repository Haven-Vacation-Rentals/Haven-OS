/**
 * Public lead-magnet layout — intentionally minimal. No sidebar, no auth.
 * Inherits fonts and globals from app/layout.tsx (Raleway + Futura PT).
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function LeadMagnetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-haven-white text-haven-charcoal">{children}</div>;
}
