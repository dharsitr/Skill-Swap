import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://skillswap.example.com";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SkillSwap — Learn & Teach Skills Through 1-on-1 Peer Exchange",
    template: "%s | SkillSwap",
  },
  description:
    "Exchange your skills directly with peers. Teach what you love, earn credits, and learn anything without money.",
  keywords: [
    "Skill Swap",
    "Peer Learning",
    "Knowledge Exchange",
    "Skill Sharing",
    "Mentorship",
    "Peer to Peer Tutoring",
  ],
  authors: [{ name: "SkillSwap Team" }],
  creator: "SkillSwap",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "SkillSwap — Peer-to-Peer Skill Exchange Platform",
    description:
      "Exchange your skills directly with peers. Teach what you love, earn credits, and learn anything without money.",
    siteName: "SkillSwap",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillSwap — Peer-to-Peer Skill Exchange Platform",
    description:
      "Exchange your skills directly with peers. Teach what you love, earn credits, and learn anything without money.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
