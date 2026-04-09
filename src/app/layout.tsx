import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const headingFont = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TusharFitness | Fitness Startup SaaS",
  description:
    "Premium Indian fitness startup SaaS with guided workouts, fuel plans, analytics, referrals, streaks, and AI support.",
  icons: {
    icon: "/logo/logo.png",
    shortcut: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${headingFont.variable} ${bodyFont.variable}`}
    >
      <body className="bg-(--background) font-sans text-(--foreground) antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
