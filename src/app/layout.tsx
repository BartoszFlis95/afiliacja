import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato, Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Playfair/Lato pozostają załadowane (nieużywane domyślnie) do czasu
// przeprojektowania landing page w kolejnym kroku redesignu — Inter jest
// teraz domyślnym fontem UI (premium, jak Stripe/Linear/Vercel).
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="scroll-smooth">
      <body className={`${lato.variable} ${playfair.variable} ${inter.variable}`}>
        <SessionProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
