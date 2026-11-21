import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Serif, Noto_Serif_Bengali, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans({ variable: "--font-sans-latin", subsets: ["latin"] });
const sansDevanagari = Noto_Sans_Devanagari({ variable: "--font-sans-devanagari", subsets: ["devanagari"] });
const sansBengali = Noto_Sans_Bengali({ variable: "--font-sans-bengali", subsets: ["bengali"] });
const serif = Noto_Serif({ variable: "--font-serif-latin", subsets: ["latin"] });
const serifDevanagari = Noto_Serif_Devanagari({ variable: "--font-serif-devanagari", subsets: ["devanagari"] });
const serifBengali = Noto_Serif_Bengali({ variable: "--font-serif-bengali", subsets: ["bengali"] });

const fontClasses = [sans, sansDevanagari, sansBengali, serif, serifDevanagari, serifBengali].map((font) => font.variable).join(" ");

// Applies the saved or system theme before first paint so dark mode never flashes light.
const themeScript = `try{if(localStorage.theme==="dark"||(!localStorage.theme&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch{}`;

export const metadata: Metadata = {
  title: "ScamShield",
  description: "Check if a message is a scam, and see the trap in your own language.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontClasses} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
