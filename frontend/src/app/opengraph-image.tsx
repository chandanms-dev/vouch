import { ImageResponse } from "next/og";

export const alt = "Vouch. Taste you can trust.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mixtape tokens (docs/design/tokens.md)
const INK = "#0E1633";
const CREAM = "#FBF7EC";
const MUTED = "#B9C1DD";
const LAVENDER = "#B9A7FF";
const PINK = "#FF9FD0";

/** Bricolage Grotesque 800 from Google Fonts; falls back to the default sans if the fetch fails. */
async function loadFont() {
  try {
    // No User-Agent: Google then serves TrueType, which satori can read (it cannot read woff2).
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800")).text();
    const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

function Card({ title, name, score, bg, tilt }: { title: string; name: string; score: number; bg: string; tilt: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 300,
        height: 190,
        padding: 22,
        borderRadius: 24,
        background: bg,
        color: INK,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", background: INK, color: CREAM, borderRadius: 999, padding: "6px 16px", fontSize: 22 }}>
          {name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: CREAM,
            fontSize: 36,
            transform: "rotate(-6deg)",
          }}
        >
          {score}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 38 }}>{title}</div>
    </div>
  );
}

export default async function OpengraphImage() {
  const font = await loadFont();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: INK,
          color: CREAM,
          padding: 72,
          fontFamily: font ? "Bricolage" : "sans-serif",
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 150, letterSpacing: -6, lineHeight: 1 }}>vouch</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 54, lineHeight: 1.1 }}>Taste you can trust.</div>
            <div style={{ display: "flex", fontSize: 28, color: MUTED, marginTop: 14 }}>
              TV and anime picks from your friends.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, width: 340 }}>
          <Card title="Frieren" name="Dev" score={10} bg={PINK} tilt={4} />
          <Card title="Severance" name="Maya" score={9} bg={LAVENDER} tilt={-4} />
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Bricolage", data: font, weight: 800, style: "normal" }] : undefined },
  );
}
