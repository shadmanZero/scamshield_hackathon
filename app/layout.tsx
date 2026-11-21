import type { Metadata, Viewport } from "next";
import {
  Noto_Sans,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Serif,
  Noto_Serif_Bengali,
  Noto_Serif_Devanagari,
} from "next/font/google";
import "./globals.css";

const sans = Noto_Sans({ variable: "--font-sans-latin", subsets: ["latin"] });
// The Indic faces carry unicode-range rules, so without a preload hint the browser only fetches
// them once text in that script is actually on screen.
const sansDevanagari = Noto_Sans_Devanagari({ variable: "--font-sans-devanagari", subsets: ["devanagari"], preload: false });
const sansBengali = Noto_Sans_Bengali({ variable: "--font-sans-bengali", subsets: ["bengali"], preload: false });
const serif = Noto_Serif({ variable: "--font-serif-latin", subsets: ["latin"] });
const serifDevanagari = Noto_Serif_Devanagari({ variable: "--font-serif-devanagari", subsets: ["devanagari"], preload: false });
const serifBengali = Noto_Serif_Bengali({ variable: "--font-serif-bengali", subsets: ["bengali"], preload: false });

const fontClasses = [sans, sansDevanagari, sansBengali, serif, serifDevanagari, serifBengali].map((font) => font.variable).join(" ");

// Applies the saved or system theme before first paint so dark mode never flashes light.
const themeScript = `try{if(localStorage.theme==="dark"||(!localStorage.theme&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch{}`;

export const metadata: Metadata = {
  title: "ScamShield",
  description: "Check if a message is a scam, and see the trap in your own language.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0f141c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClasses} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
