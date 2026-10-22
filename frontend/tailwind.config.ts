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
      // Named text styles. Sizes are measured from the docs/design PNG exports (not Figma);
      // see "Type scale" in docs/design/tokens.md. Display styles carry their tracking.
      fontSize: {
        // Marketing (landing only; not measured from a screen export)
        ghost: ["300px", { lineHeight: "0.8", letterSpacing: "-0.06em" }],
        "ghost-sm": ["132px", { lineHeight: "0.8", letterSpacing: "-0.06em" }],
        wordmark: ["96px", { lineHeight: "1", letterSpacing: "-0.04em" }],
        hero: ["76px", { lineHeight: "72px", letterSpacing: "-0.03em" }],
        "hero-md": ["64px", { lineHeight: "60px", letterSpacing: "-0.025em" }],
        "hero-sm": ["44px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        title: ["40px", { lineHeight: "44px", letterSpacing: "-0.025em" }],
        heading: ["36px", { lineHeight: "40px", letterSpacing: "-0.025em" }],
        lead: ["18px", { lineHeight: "28px" }],
        "stamp-lg": ["48px", { lineHeight: "1" }],
        logo: ["32px", { lineHeight: "1", letterSpacing: "-0.04em" }],
        // Measured from exports
        display: ["60px", { lineHeight: "60px", letterSpacing: "-0.03em" }], // detail title, desktop
        page: ["44px", { lineHeight: "48px", letterSpacing: "-0.03em" }], // page title, FoF name
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.02em" }], // profile name, detail title, mobile
        h2: ["24px", { lineHeight: "28px", letterSpacing: "-0.02em" }], // section titles
        card: ["22px", { lineHeight: "28px", letterSpacing: "-0.025em" }], // card title
        h3: ["20px", { lineHeight: "24px", letterSpacing: "-0.01em" }], // My taste, My vouches
        stat: ["56px", { lineHeight: "56px", letterSpacing: "-0.03em" }], // friends' average, big avatar initial
        stamp: ["28px", { lineHeight: "28px" }], // rating stamp number
        "stamp-sm": ["20px", { lineHeight: "20px" }],
        body: ["16px", { lineHeight: "24px" }], // review, buttons
        "body-sm": ["15px", { lineHeight: "20px" }], // subtitles, detail meta, handle
        label: ["14px", { lineHeight: "20px" }], // author, nav, Back, small buttons
        chip: ["14px", { lineHeight: "16px" }], // type badge, Upcoming
        meta: ["13px", { lineHeight: "16px" }], // card meta, timestamps, counts
        tag: ["13px", { lineHeight: "16px" }], // tag pills, filter chips
        micro: ["11px", { lineHeight: "12px" }], // "Coming soon", count pills
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
