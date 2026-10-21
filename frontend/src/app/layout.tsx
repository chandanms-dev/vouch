import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  adjustFontFallback: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vouch",
  description: "Recommendations from people you actually know.",
};

export const viewport: Viewport = {
  themeColor: "#0E1633",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${nunito.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-cream">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
