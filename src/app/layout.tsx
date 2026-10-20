import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f77fa5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.biarfokus.site"),
  title: "BiarFokus — Bantu kamu fokus selesain setiap pekerjaan",
  description:
    "Aplikasi Pomodoro timer akurat dan task management harian untuk membantumu fokus, konsisten, dan menyelesaikan setiap pekerjaan.",
  keywords: [
    "Pomodoro Timer",
    "BiarFokus",
    "Produktivitas",
    "Focus Timer",
    "Manajemen Tugas",
    "Work Tracker",
    "Deep Work",
  ],
  authors: [{ name: "BiarFokus Team" }],
  creator: "BiarFokus",
  publisher: "BiarFokus",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BiarFokus",
  },
  icons: {
    icon: [
      { url: "/biarfokus-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/biarfokus-icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/biarfokus-icon.png",
    apple: [{ url: "/biarfokus-icon.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "BiarFokus — Bantu kamu fokus selesain setiap pekerjaan",
    description:
      "Aplikasi Pomodoro timer akurat, task management, focus streaks, dan suara latar penenang untuk produktivitas maksimal.",
    url: "https://www.biarfokus.site",
    siteName: "BiarFokus",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BiarFokus — Bantu kamu fokus selesain setiap pekerjaan",
    description:
      "Aplikasi Pomodoro timer akurat dan task management harian untuk membantumu fokus dan konsisten.",
  },
};

import { AppProvider } from "@/app/providers/app-provider";
import { AppShell } from "@/app/components/app-shell";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
