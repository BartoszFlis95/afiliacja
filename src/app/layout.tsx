import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeScript } from "@/components/shared/ThemeScript";
import "./globals.css";

// Playfair i Lato były tu ładowane „na później", ale żaden komponent ani
// żadna klasa Tailwinda ich nie używała — pobierały się na każdej stronie
// bez jednego znaku na ekranie. Inter jest jedynym fontem UI.
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
        width: 2172,
        height: 724,
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
    // suppressHydrationWarning — ThemeScript dopisuje `.dark` na <html> zanim
    // React się zhydratuje, więc klasa na serwerze i w kliencie celowo się różni.
    <html lang="pl" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.variable}>
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
