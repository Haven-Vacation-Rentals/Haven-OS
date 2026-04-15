import { Raleway } from "next/font/google";

/**
 * Raleway — Haven's body/UI typeface.
 * Loaded via next/font for zero-CLS font delivery.
 *
 * Futura PT is loaded via an Adobe Typekit link tag in app/layout.tsx
 * because Adobe Fonts can't be hosted via next/font.
 */
export const raleway = Raleway({
  subsets: ["latin", "latin-ext"],
  variable: "--font-raleway",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});
