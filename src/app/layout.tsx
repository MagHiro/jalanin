import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./fieldnotes.css";
import "./overview-editorial.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RouteFrame } from "@/components/layout/route-frame";

const googleSansFlex = localFont({
  src: "./fonts/google-sans-flex-latin.woff2",
  variable: "--font-google-sans-flex",
  weight: "100 1000",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Jalanin Internships — Southeast Asia Internship Placements",
    template: "%s · Jalanin Internships",
  },
  description:
    "Browse internship placements across Southeast Asia, apply with guidance, and receive a custom quotation.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={googleSansFlex.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-primary focus:p-3 focus:text-white"
        >
          Skip to content
        </a>
        <RouteFrame header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </RouteFrame>
      </body>
    </html>
  );
}
