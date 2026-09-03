export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AcceptTermsForm } from "@/components/auth/AcceptTermsForm";
import { DATA_AKTUALIZACJI, WERSJA_REGULAMINU } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Akceptacja regulaminu",
  robots: { index: false, follow: false },
};

const PANEL_ROLI: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/brand/dashboard",
  INFLUENCER: "/influencer/dashboard",
};

export default async function AcceptTermsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tosAcceptedAt: true, privacyAcceptedAt: true, tosVersion: true },
  });

  const panel = PANEL_ROLI[session.user.role ?? "INFLUENCER"] ?? "/influencer/dashboard";

  // Ktoś, kto już zaakceptował aktualną wersję, nie ma tu czego szukać.
  if (user?.tosAcceptedAt && user.privacyAcceptedAt && user.tosVersion === WERSJA_REGULAMINU) {
    redirect(panel);
  }

  // Konto założone przed wprowadzeniem zgód kontra zmiana regulaminu —
  // komunikat inny, bo to dwie różne sytuacje dla użytkownika.
  const poAktualizacji = Boolean(user?.tosAcceptedAt);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary/10 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-primary/20 bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {poAktualizacji ? "Regulamin się zmienił" : "Zanim przejdziesz dalej"}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {poAktualizacji ? (
            <>
              Zaktualizowaliśmy regulamin platformy — obowiązuje wersja{" "}
              {WERSJA_REGULAMINU} z {DATA_AKTUALIZACJI}. Prosimy o zapoznanie się
              z nim i ponowną akceptację.
            </>
          ) : (
            <>
              Twoje konto powstało, zanim wprowadziliśmy elektroniczną akceptację
              dokumentów. Aby dalej korzystać z platformy, potwierdź zapoznanie się
              z regulaminem i polityką prywatności.
            </>
          )}
        </p>

        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Najważniejsza zmiana: rozliczenia prowadzimy w cyklu miesięcznym.
          Wypłaty prowizji są odblokowywane po opłaceniu przez markę faktury za
          dany okres.
        </p>

        <div className="mt-6">
          <AcceptTermsForm redirectTo={panel} />
        </div>
      </div>
    </div>
  );
}
