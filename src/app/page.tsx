import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

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
  },
  {
    icon: "📊",
    title: "Statystyki w czasie rzeczywistym",
    description:
      "Kliknięcia, konwersje i zarobki aktualizowane na bieżąco.",
  },
  {
    icon: "⚡",
    title: "Szybkie wypłaty",
    description:
      "Wypłaty przez IBAN lub Stripe Connect. Pieniądze trafiają bezpośrednio na konto.",
  },
  {
    icon: "🔗",
    title: "Unikalne linki afiliacyjne",
    description:
      "Każdy influencer ma swój link z UTM tracking i cookie 30 dni.",
  },
  {
    icon: "📧",
    title: "Automatyczne powiadomienia",
    description:
      "Emaile o nowych komisjach, zatwierdzeniach i wypłatach. Zero ręcznej pracy.",
  },
  {
    icon: "📱",
    title: "Responsywny panel",
    description:
      "Zarządzaj platformą z telefonu, tabletu lub komputera. Zawsze pod ręką.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(ROLE_REDIRECT[session.user.role] ?? "/login");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      {/* Hero */}
      <section className="scroll-mt-24 bg-gradient-to-br from-[#EFF6FF] via-white to-[#DBEAFE] px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16 lg:px-8 lg:pt-32 lg:pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Logo dominujące — na mobile wyśrodkowane nad tekstem (grid
              zwija się do jednej kolumny), na lg: lewa kolumna obok tekstu. */}
          <Image
            src="/logo.png"
            alt="Deneeu"
            width={600}
            height={600}
            className="
              object-contain
              drop-shadow-2xl
              w-[300px] h-[300px]
              sm:w-[450px] sm:h-[450px]
              lg:w-[600px] lg:h-[600px]
              mx-auto
            "
            priority
            unoptimized
          />

          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              🚀 Platforma CPS dla marek i influencerów
            </span>

            <h1 className="mt-6 text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl lg:text-6xl">
              Łączymy marki z influencerami przez marketing afiliacyjny
            </h1>

            <p className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl lg:text-3xl">
              Automatyzuj prowizje, śledzenie konwersji i wypłaty
            </p>

            <p className="mt-6 max-w-lg text-base text-slate-500 sm:text-lg">
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

            <ul className="mt-10 flex flex-col items-center gap-2 text-sm text-slate-500 sm:flex-row sm:gap-6 lg:items-start">
              <li className="flex items-center gap-2">
                <span className="text-blue-600">✓</span> Darmowa rejestracja
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">✓</span> Bez karty kredytowej
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">✓</span> Pierwsze wyniki w
                24h
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        className="scroll-mt-24 bg-[#EFF6FF] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              Jak to działa?
            </h2>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Trzy proste kroki do automatycznych prowizji
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="inline-flex rounded-2xl bg-blue-100 p-4 text-4xl">
                  {step.icon}
                </div>
                <div className="mx-auto -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#0F172A]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {step.description}
                </p>

                {index < STEPS.length - 1 && (
                  <span className="absolute right-[-1.5rem] top-8 hidden text-4xl text-blue-300 lg:block">
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
        className="scroll-mt-24 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              Dla marek i influencerów
            </h2>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Jedna platforma — dwie strony sukcesu
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-2">
            <div>
              <div className="rounded-t-2xl bg-blue-600 p-6">
                <h3 className="text-xl font-bold text-white">🏢 Dla Marek</h3>
              </div>
              <div className="rounded-b-2xl border border-blue-100 bg-[#EFF6FF] p-6 sm:p-8 lg:p-10">
                <ul className="space-y-3">
                  {BRAND_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="text-blue-600">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 h-12 w-full text-base">
                  <Link href="/register">Zarejestruj markę →</Link>
                </Button>
              </div>
            </div>

            <div>
              <div className="rounded-t-2xl bg-[#0F172A] p-6">
                <h3 className="text-xl font-bold text-white">
                  🎯 Dla Influencerów
                </h3>
              </div>
              <div className="rounded-b-2xl border border-blue-100 bg-white p-6 sm:p-8 lg:p-10">
                <ul className="space-y-3">
                  {INFLUENCER_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="text-blue-600">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 h-12 w-full bg-[#0F172A] text-base hover:bg-[#1E293B]"
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
        className="scroll-mt-24 bg-[#EFF6FF] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              Dlaczego Deneeu?
            </h2>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Wszystko czego potrzebujesz w jednym miejscu
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {feature.icon}
                </span>
                <h3 className="mb-2 mt-4 font-bold text-[#0F172A]">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="mx-4 my-12 max-w-5xl rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-10 text-center sm:px-8 lg:mx-auto lg:my-20 lg:py-16">
        <h2 className="text-3xl font-black text-white sm:text-4xl">
          Gotowy aby zacząć?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-blue-200 sm:text-lg">
          Dołącz do platformy i zacznij zarabiać na afiliacji już dziś.
          Rejestracja jest darmowa.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 h-12 w-full rounded-xl bg-white px-8 text-base font-bold text-blue-600 hover:bg-blue-50 sm:h-auto sm:w-auto sm:py-4 sm:text-lg"
        >
          <Link href="/register">Utwórz konto za darmo →</Link>
        </Button>
        <p className="mt-4 text-sm text-blue-300">
          Bez karty kredytowej · Darmowa rejestracja
        </p>
      </section>

      <Footer />
    </div>
  );
}
