import type { Config } from "tailwindcss";

// Tokens from docs/Foundations.pdf (Figma names in comments); see docs/design/tokens.md.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1633", // Ground (ink 900); also text on fields
        surface: "#1A2550", // Surface (ink 800)
        raised: "#2A376E", // Surface high (ink 700)
        edge: "#263163",
        cream: "#FBF7EC", // Paper
        muted: "#B9C1DD", // Mist / muted text
        lavender: "#B9A7FF", // color/field/film (Shows field)
        lime: "#C8F23D", // color/field/book
        pink: "#FF9FD0", // color/field/anime
        sky: "#84D0FF", // color/field/place
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["72px", { lineHeight: "72px", letterSpacing: "-0.02em" }],
        "hero-sm": ["44px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.01em" }],
        h2: ["24px", { lineHeight: "28px" }],
        card: ["22px", { lineHeight: "28px" }],
        meta: ["12px", { lineHeight: "16px" }],
        tag: ["13px", { lineHeight: "16px" }],
      },
      borderRadius: { card: "24px" },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheetIn: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        popIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        stepIn: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: { "50%": { opacity: "0.55" } },
      },
      animation: {
        "fade-up": "fadeUp 300ms cubic-bezier(0.23,1,0.32,1) both",
        "fade-in": "fadeIn 200ms ease-out both",
        "sheet-in": "sheetIn 320ms cubic-bezier(0.32,0.72,0,1) both",
        "pop-in": "popIn 200ms cubic-bezier(0.23,1,0.32,1) both",
        "step-in": "stepIn 240ms cubic-bezier(0.23,1,0.32,1) both",
        "pulse-soft": "pulseSoft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
