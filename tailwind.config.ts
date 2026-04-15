import type { Config } from "tailwindcss";

/**
 * Haven OS design tokens.
 *
 * Source of truth: brand packet extracted from havenvacationrentals.com
 *   - Coral  #FF564E  (primary accent / CTAs / links / active states)
 *   - Charcoal #424242 (ink, dark sections)
 *   - Sage Mist #EDF0EE (secondary surface / section alt)
 *   - White #FFFFFF
 *   - Dark Gray #333333 (secondary ink)
 *
 * Typography: Futura PT (headings) + Raleway (body/UI).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // Raw Haven palette
        haven: {
          coral: "#FF564E",
          "coral-700": "#E8463F",
          "coral-100": "#FFE4E2",
          charcoal: "#424242",
          ink: "#333333",
          sage: "#EDF0EE",
          "sage-200": "#DDE3E0",
          cream: "#FAF8F3",
          white: "#FFFFFF",
        },
        // Semantic tokens (consumed by components)
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
      },
      fontFamily: {
        heading: [
          "futura-pt",
          "Futura",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: ["var(--font-raleway)", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Matches Haven's type scale where relevant
        "display-1": ["40px", { lineHeight: "1.1", fontWeight: "700" }],
        "display-2": ["34px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-3": ["29px", { lineHeight: "1.2", fontWeight: "700" }],
        "display-4": ["24px", { lineHeight: "1.25", fontWeight: "700" }],
      },
      letterSpacing: {
        cta: "2px",
      },
      borderRadius: {
        pill: "30px",
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(66,66,66,0.06), 0 1px 1px rgba(66,66,66,0.03)",
        "card-hover":
          "0 4px 14px rgba(66,66,66,0.08), 0 2px 4px rgba(66,66,66,0.04)",
        ring: "0 0 0 3px rgba(255,86,78,0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 240ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
