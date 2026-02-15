import "./globals.css";
import React from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const _ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
});
const _sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "OptivexIQ - SaaS Conversion Intelligence Platform",
  description:
    "OptivexIQ analyzes your SaaS homepage and pricing against competitors, uncovers conversion gaps, and rewrites your messaging to drive more demos and trials.",
};

export const viewport: Viewport = {
  themeColor: "#0c0c14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${_ibmPlexSans.variable} ${_sora.variable} ${_jetbrainsMono.variable}`}
    >
      <body>
        <main className="font-sans antialiased">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
