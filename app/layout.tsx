import type { Metadata } from "next";
import { raleway } from "@/lib/fonts";
import { ThemeProvider } from "@/components/shell/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haven OS",
  description: "The operating system for Haven Vacation Rentals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={raleway.variable} suppressHydrationWarning>
      <head>
        {/* Futura PT via Adobe Fonts / Typekit (kit ID from brand packet) */}
        <link rel="stylesheet" href="https://use.typekit.net/sjo0mew.css" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
