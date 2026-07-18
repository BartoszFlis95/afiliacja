import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800", "900"],
});

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.deneeu.pl"),
  title: {
    default: "Deneeu — Platforma Affiliate Marketing CPS",
    template: "%s | Deneeu",
  },
  description:
    "Łączymy marki z influencerami przez marketing afiliacyjny CPS. Automatyczne prowizje, śledzenie konwersji i wypłaty.",
  keywords: [
    "affiliate marketing",
    "marketing afiliacyjny",
    "CPS",
    "influencer marketing",
    "prowizje",
  ],
  authors: [{ name: "Deneeu" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://www.deneeu.pl",
    siteName: "Deneeu",
    title: "Deneeu — Affiliate Marketing dla Marek i Influencerów",
    description: "Platforma CPS łącząca marki z influencerami.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Deneeu — Affiliate Marketing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deneeu — Affiliate Marketing CPS",
    description: "Platforma CPS łącząca marki z influencerami.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="scroll-smooth">
      <body className={`${lato.variable} ${playfair.variable}`}>
        <SessionProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
