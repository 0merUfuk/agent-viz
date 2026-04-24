import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "agent-viz",
  description: "Interactive visualization of a Claude Code agent ecosystem",
};

// Phase 1 wires in the full font stack (Cinzel, Orbitron, Inter, JetBrains Mono)
// via next/font/google per DESIGN.md §3.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
