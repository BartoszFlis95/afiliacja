import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeScript } from "@/components/shared/ThemeScript";
import { SkipLink } from "@/components/shared/SkipLink";
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
    // Osobny obraz OG, nie logo. Logo ma proporcje 3:1, a Slack, LinkedIn,
    // X i Facebook oczekują 1200x630 (1.91:1) — logo było w podglądach
    // przycinane albo pokazywane z pasami. PNG, nie WebP: starsze scrapery
    // społecznościowe bywają wybredne co do formatu.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deneeu — platforma affiliate marketing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deneeu — Affiliate Marketing CPS",
    description: "Platforma CPS łącząca marki z influencerami.",
    images: ["/og-image.png"],
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
        <SkipLink />
        {/*
          SessionProvider, TooltipProvider i Toaster były tu, czyli ładowały się
          na KAŻDEJ stronie — także na landingu, logowaniu, dokumentacji i
          regulaminie, gdzie żadne z nich nie jest do niczego używane.
          SessionProvider w ogóle nie miał odbiorcy: nigdzie nie ma useSession,
          a wylogowanie idzie przez akcję serwerową. Tooltip pojawia się tylko
          w wykresach, a toast() wyłącznie w komponentach paneli — wszystkie
          trzy siedzą teraz w layoucie (dashboard).
        */}
        {children}
      </body>
    </html>
  );
}
