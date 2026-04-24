import type { Metadata } from "next";
import { Cinzel, Orbitron, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--next-font-cinzel",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--next-font-orbitron",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--next-font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--next-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "agent-viz — observe the ecosystem",
  description: "Interactive visualization of a Claude Code agent ecosystem. Paste any public GitHub repo with a .claude/ directory.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "agent-viz",
    description: "Observe the ecosystem — any .claude/ dir, live.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${cinzel.variable} ${orbitron.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[var(--void)] text-[var(--text)]">
        {children}
      </body>
    </html>
  );
}
