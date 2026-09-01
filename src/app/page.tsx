import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AnimatedStat } from "@/components/landing/AnimatedStat";

export const metadata: Metadata = {
  title: "Deneeu — Platforma Affiliate Marketing CPS",
  description:
    "Łączymy marki z influencerami przez marketing afiliacyjny CPS. Automatyczne prowizje, śledzenie konwersji i wypłaty. Darmowa rejestracja.",
  openGraph: {
    title: "Deneeu — Affiliate Marketing dla Marek i Influencerów",
    description:
      "Platforma CPS łącząca marki z influencerami. Płacisz tylko za wyniki.",
    url: "https://www.deneeu.pl",
    siteName: "Deneeu",
    locale: "pl_PL",
    type: "website",
  },
};

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/brand/dashboard",
  INFLUENCER: "/influencer/dashboard",
};

const STEPS = [
  {
    number: 1,
    icon: "🏢",
    title: "Dodaj produkt i ustaw prowizję",
    description:
      "Dodaj produkty, ustaw stawkę prowizji i skonfiguruj webhook do automatycznego śledzenia sprzedaży w Twoim sklepie.",
  },
  {
    number: 2,
    icon: "🔗",
    title: "Influencer generuje unikalny link",
    description:
      "Influencer wybiera produkt z katalogu i jednym kliknięciem generuje unikalny link afiliacyjny do promowania.",
  },
  {
    number: 3,
    icon: "💰",
    title: "Automatyczne prowizje i wypłaty",
    description:
      "System automatycznie śledzi konwersje, nalicza prowizje i wypłaca zarobki. Płacisz tylko za realne sprzedaże.",
  },
];

const BRAND_BENEFITS = [
  "Płacisz tylko za realną sprzedaż (CPS)",
  "Automatyczne śledzenie konwersji",
  "Panel z pełnymi statystykami",
  "Webhook API do integracji ze sklepem",
  "Zarządzanie influencerami w jednym miejscu",
  "Automatyczne faktury i rozliczenia",
];

const INFLUENCER_BENEFITS = [
  "Zarabiaj na rekomendacjach produktów",
  "Automatyczne naliczanie prowizji",
  "Szybkie wypłaty przez IBAN lub Stripe",
  "Statystyki kliknięć i konwersji",
  "Unikalne linki z UTM tracking",
  "Dokumenty rozliczeniowe (rachunek/faktura)",
];

const FEATURES = [
  {
    icon: "🔒",
    title: "Bezpieczne webhooky",
    description:
      "Weryfikacja apiKey i HMAC dla każdego żądania. Twoje dane są bezpieczne.",
    gradient: "from-primary/10 to-primary/15",
  },
  {
    icon: "📊",
    title: "Statystyki w czasie rzeczywistym",
    description:
      "Kliknięcia, konwersje i zarobki aktualizowane na bieżąco.",
    gradient: "from-success/10 to-success/15",
  },
  {
    icon: "⚡",
    title: "Szybkie wypłaty",
    description:
      "Wypłaty przez IBAN lub Stripe Connect. Pieniądze trafiają bezpośrednio na konto.",
    gradient: "from-warning/10 to-warning/15",
  },
  {
    icon: "🔗",
    title: "Unikalne linki afiliacyjne",
    description:
      "Każdy influencer ma swój link z UTM tracking i cookie 30 dni.",
    gradient: "from-primary/10 to-primary/15",
  },
  {
    icon: "📧",
    title: "Automatyczne powiadomienia",
    description:
      "Emaile o nowych komisjach, zatwierdzeniach i wypłatach. Zero ręcznej pracy.",
    gradient: "from-destructive/10 to-destructive/15",
  },
  {
    icon: "📱",
    title: "Responsywny panel",
    description:
      "Zarządzaj platformą z telefonu, tabletu lub komputera. Zawsze pod ręką.",
    gradient: "from-muted to-border/50",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(ROLE_REDIRECT[session.user.role] ?? "/login");
  }

  // Prawdziwe liczby z bazy — nie fikcyjne statystyki marketingowe.
  const [totalBrands, totalInfluencers, totalProducts, totalConversions] = await Promise.all([
    prisma.brandProfile.count(),
    prisma.influencerProfile.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.conversion.count(),
  ]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-card">
      <Navbar />

      {/* Hero */}
      <section className="scroll-mt-24 bg-gradient-to-br from-muted/40 via-background to-primary/10 px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 lg:pt-32 lg:pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Na mobile logo schodzi POD tekst (order-2). Wcześniej stało nad
              nagłówkiem w rozmiarze 90vw i samo zajmowało cały pierwszy ekran —
              propozycja wartości i CTA lądowały poniżej zgięcia. Od lg: wraca
              na swoje miejsce w lewej kolumnie. */}
          <Image
            src="/logo.png"
            alt="Deneeu"
            width={1600}
            height={903}
            sizes="(min-width: 1024px) 640px, (min-width: 640px) 420px, 80vw"
            className="order-2 mx-auto h-auto w-full max-w-[280px] rounded-2xl object-contain drop-shadow-2xl sm:max-w-[420px] lg:order-1 lg:max-w-[640px]"
            priority
          />

          <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:items-start lg:text-left">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              🚀 Platforma CPS dla marek i influencerów
            </span>

            <h1 className="mt-6 text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-6xl">
              Łączymy marki z influencerami przez marketing afiliacyjny
            </h1>

            <p className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl lg:text-3xl">
              Automatyzuj prowizje, śledzenie konwersji i wypłaty
            </p>

            <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
              Platforma CPS (Cost Per Sale) która łączy marki z
              influencerami. Płacisz tylko za wyniki.
            </p>

            <div className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-auto w-full rounded-xl px-6 py-3 text-base sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <Link href="/register">Zacznij teraz →</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-auto w-full rounded-xl px-6 py-3 text-base sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <a href="#jak-to-dziala">Jak to działa ↓</a>
              </Button>
            </div>

            <ul className="mt-10 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6 lg:items-start">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Darmowa rejestracja
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Bez karty kredytowej
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> Pierwsze wyniki w
                24h
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Statystyki */}
      <section className="border-y border-border/60 bg-card px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
          <AnimatedStat value={totalBrands} label="Marek na platformie" />
          <AnimatedStat value={totalInfluencers} label="Influencerów" />
          <AnimatedStat value={totalProducts} label="Aktywnych produktów" />
          <AnimatedStat value={totalConversions} label="Śledzonych konwersji" />
        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        className="scroll-mt-24 bg-muted/50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Jak to działa?
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Trzy proste kroki do automatycznych prowizji
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="inline-flex rounded-2xl bg-muted p-4 text-4xl shadow-sm">
                  {step.icon}
                </div>
                <div className="mx-auto -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-sidebar-foreground">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>

                {index < STEPS.length - 1 && (
                  <span className="absolute right-[-1.5rem] top-8 hidden text-4xl text-muted-foreground/60 lg:block">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dla kogo */}
      <section
        id="dla-kogo"
        className="scroll-mt-24 bg-card px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Dla marek i influencerów
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Jedna platforma — dwie strony sukcesu
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6">
                <h3 className="text-xl font-semibold text-white">🏢 Dla Marek</h3>
              </div>
              <div className="bg-muted/50 p-6 sm:p-8 lg:p-10">
                <ul className="space-y-3">
                  {BRAND_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 h-12 w-full text-base">
                  <Link href="/register">Zarejestruj markę →</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <div className="bg-sidebar p-6">
                <h3 className="text-xl font-semibold text-sidebar-foreground">
                  🎯 Dla Influencerów
                </h3>
              </div>
              <div className="bg-card p-6 sm:p-8 lg:p-10">
                <ul className="space-y-3">
                  {INFLUENCER_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-foreground">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 h-12 w-full text-base"
                >
                  <Link href="/register">Zarejestruj się →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Korzyści */}
      <section
        id="korzysci"
        className="scroll-mt-24 bg-muted/50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Dlaczego Deneeu?
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Wszystko czego potrzebujesz w jednym miejscu
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${feature.gradient}`}
                >
                  {feature.icon}
                </span>
                <h3 className="mb-2 mt-4 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section
        data-surface="dark"
        className="relative mx-4 my-12 max-w-5xl overflow-hidden rounded-3xl px-6 py-10 text-center shadow-lg sm:px-8 lg:mx-auto lg:my-20 lg:py-16"
      >
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-800/90" />

        <div className="relative">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Gotowy aby zacząć?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
            Dołącz do platformy i zacznij zarabiać na afiliacji już dziś.
            Rejestracja jest darmowa.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 w-full rounded-xl bg-card px-8 text-base font-semibold text-primary shadow-sm transition-all duration-200 hover:bg-primary/10 hover:shadow-md sm:h-auto sm:w-auto sm:py-4 sm:text-lg"
          >
            <Link href="/register">Utwórz konto za darmo →</Link>
          </Button>
          <p className="mt-4 text-sm text-blue-200">
            Bez karty kredytowej · Darmowa rejestracja
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
