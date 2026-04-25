/**
 * Public pitch layout — intentionally minimal. No sidebar, no auth.
 * Inherits fonts and globals from app/layout.tsx (Raleway + Futura PT).
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-haven-white text-haven-charcoal">{children}</div>;
}
