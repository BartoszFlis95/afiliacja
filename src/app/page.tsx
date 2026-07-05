import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Link2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STATS = [
  { value: "500+", label: "Marek" },
  { value: "10K+", label: "Influencerów" },
  { value: "2M+", label: "Kliknięć/mies." },
  { value: "98%", label: "Satysfakcji" },
];

const FEATURES = [
  {
    icon: Link2,
    title: "Linki afiliacyjne w sekundę",
    description:
      "Influencerzy generują unikalne linki do produktów jednym kliknięciem i od razu widzą kliknięcia oraz konwersje.",
  },
  {
    icon: BarChart3,
    title: "Statystyki w czasie rzeczywistym",
    description:
      "Wykresy przychodu, konwersji i kliknięć dla marek i influencerów — z eksportem do CSV i filtrami dat.",
  },
  {
    icon: Wallet,
    title: "Automatyczne wypłaty",
    description:
      "Prowizje zatwierdzane przez markę i wypłacane influencerom automatycznie przez Stripe Connect, bez ręcznych przelewów.",
  },
  {
    icon: ShieldCheck,
    title: "Przejrzyste rozliczenia",
    description:
      "Faktury generowane automatycznie, pełna historia konwersji i wypłat dostępna dla każdej ze stron.",
  },
];

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/brand/dashboard",
  INFLUENCER: "/influencer/dashboard",
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(ROLE_REDIRECT[session.user.role] ?? "/login");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#0F172A]">Deneeu</span>
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Dołącz teraz</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#EFF6FF] via-white to-[#DBEAFE] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl">
            Platforma Affiliate Marketing
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              dla profesjonalistów
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
            Zarządzaj kampaniami, generuj linki afiliacyjne i śledź konwersje
            w czasie rzeczywistym — wszystko w jednym miejscu.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Rozpocznij za darmo</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Mam już konto</Link>
            </Button>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-[#0F172A] sm:text-3xl">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#0F172A]">
              Wszystko czego potrzebujesz do affiliate marketingu
            </h2>
            <p className="mt-3 text-slate-500">
              Od pierwszego linku po automatyczną wypłatę — Deneeu prowadzi
              markę i influencera przez cały proces.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="rounded-2xl border-blue-100 bg-[#EFF6FF]">
                <CardContent className="p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-[#0F172A]">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-100 px-6 py-8">
        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Deneeu. Wszelkie prawa zastrzeżone.
        </p>
      </footer>
    </div>
  );
}
